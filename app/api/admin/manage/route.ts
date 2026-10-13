import { NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
const PRIMARY_ADMIN_USER_ID = "42dcd32a-2ec6-406c-8be3-703237a33d0d";

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Admin service is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function authorized(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) } as const;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Admin service is not configured.");
  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { error: NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 }) } as const;
  const { data: roleRow, error: roleError } = await admin.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
  if (roleError) return { error: NextResponse.json({ error: "Unable to verify staff permissions." }, { status: 500 }) } as const;
  if (!roleRow?.role) return { error: NextResponse.json({ error: "This account has no Shree Gauri staff access." }, { status: 403 }) } as const;
  return { admin, user: data.user, role: String(roleRow.role) } as const;
}

async function audit(admin: ReturnType<typeof serviceClient>, actor: User, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  const { error } = await admin.from("admin_audit_log").insert({
    actor_user_id: actor.id, action, target_type: targetType, target_id: targetId, metadata
  });
  if (error) throw new Error("Action could not be audited; no deletion was performed.");
}

async function listStaff(admin: ReturnType<typeof serviceClient>) {
  const { data: rows, error } = await admin.from("admin_users").select("user_id,role,created_at").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const { data: userPage, error: userError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (userError) throw new Error(userError.message);
  const users = new Map((userPage.users || []).map((u) => [u.id, u]));
  return (rows || []).map((row) => ({
    user_id: row.user_id,
    role: row.role,
    is_primary_admin: row.user_id === PRIMARY_ADMIN_USER_ID,
    created_at: row.created_at,
    email: users.get(row.user_id)?.email || "(email unavailable)"
  }));
}

export async function GET(request: Request) {
  try {
    const auth = await authorized(request);
    if ("error" in auth) return auth.error;
    const needsPasswordSetup = auth.user.user_metadata?.staff_password_setup === true;
    const isPrimaryAdmin = auth.user.id === PRIMARY_ADMIN_USER_ID;
    const staff = isPrimaryAdmin ? await listStaff(auth.admin) : [];
    return NextResponse.json({ role: auth.role, staff, is_primary_admin: isPrimaryAdmin, needs_password_setup: needsPasswordSetup });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin request failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let auth: Awaited<ReturnType<typeof authorized>>;
  try {
    auth = await authorized(request);
    if ("error" in auth) return auth.error;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");
    const isMainAdmin = auth.role === "admin";
    const isPrimaryAdmin = auth.user.id === PRIMARY_ADMIN_USER_ID;

    if (action === "set_password") {
      if (auth.user.user_metadata?.staff_password_setup !== true) {
        return NextResponse.json({ error: "Password setup is not pending for this account." }, { status: 403 });
      }
      const password = String(body?.password || "");
      if (password.length < 12) return NextResponse.json({ error: "Use at least 12 characters for your password." }, { status: 400 });
      const { error } = await auth.admin.auth.admin.updateUserById(auth.user.id, {
        password,
        user_metadata: { ...auth.user.user_metadata, staff_password_setup: false }
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await audit(auth.admin, auth.user, "staff_password_set", "staff", auth.user.id);
      return NextResponse.json({ ok: true });
    }

    if (!isMainAdmin) return NextResponse.json({ error: "Administrator access is required for this action." }, { status: 403 });

    if (action === "invite_staff") {
      const email = String(body?.email || "").trim().toLowerCase();
      const role = String(body?.role || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid staff email." }, { status: 400 });
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can invite or manage team access." }, { status: 403 });
      if (!["admin", "manager", "orders", "support", "catalog"].includes(role)) return NextResponse.json({ error: "Choose a valid staff role." }, { status: 400 });
      const { data: authUsers, error: listError } = await auth.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return NextResponse.json({ error: listError.message }, { status: 400 });
      const match = (authUsers.users || []).find((u) => (u.email || "").toLowerCase() === email);
      if (match) {
        const { data: currentRole } = await auth.admin.from("admin_users").select("user_id,role").eq("user_id", match.id).maybeSingle();
        if (currentRole) return NextResponse.json({ error: "That account already has staff access." }, { status: 409 });
        return NextResponse.json({ error: "An account with that email already exists. Ask them to sign in first, then have the main admin assign staff access." }, { status: 409 });
      }
      const origin = new URL(request.url).origin;
      const { data, error } = await auth.admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/admin`,
        data: { staff_password_setup: true, invited_by: auth.user.id }
      });
      if (error || !data.user) return NextResponse.json({ error: error?.message || "Unable to send staff invitation." }, { status: 400 });
      const { error: roleError } = await auth.admin.from("admin_users").insert({ user_id: data.user.id, role });
      if (roleError) {
        await auth.admin.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ error: "Invitation was not completed because the staff role could not be saved." }, { status: 500 });
      }
      await audit(auth.admin, auth.user, "staff_invited", "staff", data.user.id, { role });
      return NextResponse.json({ ok: true, message: `Invitation sent to ${email}.` });
    }

    if (action === "remove_staff") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can revoke team access." }, { status: 403 });
      const userId = String(body?.user_id || "");
      if (!userId || userId === auth.user.id) return NextResponse.json({ error: "You cannot remove your own main-admin access." }, { status: 400 });
      const { data: staffRow, error: staffError } = await auth.admin.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
      if (staffError || !staffRow) return NextResponse.json({ error: "Staff record not found." }, { status: 404 });
      if (userId === PRIMARY_ADMIN_USER_ID) return NextResponse.json({ error: "The primary main administrator account is protected and cannot be removed." }, { status: 403 });
      await audit(auth.admin, auth.user, "staff_access_revoked", "staff", userId, { previous_role: staffRow.role });
      const { error } = await auth.admin.from("admin_users").delete().eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, message: "Staff access revoked. The account itself was not deleted." });
    }

    if (action === "delete_order") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can delete orders." }, { status: 403 });
      const id = String(body?.id || "");
      const { data: order, error } = await auth.admin.from("orders").select("id,order_number,payment_status,payment_provider,payment_reference,total_inr").eq("id", id).maybeSingle();
      if (error || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      await audit(auth.admin, auth.user, "order_deleted", "order", order.id, {
        order_number: order.order_number, payment_status: order.payment_status,
        payment_provider: order.payment_provider, payment_reference: order.payment_reference,
        total_inr: order.total_inr
      });
      const { error: reservationError } = await auth.admin.from("inventory_reservations").delete().eq("order_id", id);
      if (reservationError) return NextResponse.json({ error: reservationError.message }, { status: 400 });
      const { error: itemError } = await auth.admin.from("order_items").delete().eq("order_id", id);
      if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });
      const { error: orderError } = await auth.admin.from("orders").delete().eq("id", id);
      if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 });
      return NextResponse.json({ ok: true, message: "Order deleted. Payment-reference details were retained in the restricted audit log." });
    }

    if (action === "delete_customer") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can delete customer records." }, { status: 403 });
      const id = String(body?.id || "");
      const { data: customer, error } = await auth.admin.from("customers").select("id,auth_user_id,email").eq("id", id).maybeSingle();
      if (error || !customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      if (customer.auth_user_id) {
        const { data: staffRecord } = await auth.admin.from("admin_users").select("role").eq("user_id", customer.auth_user_id).maybeSingle();
        if (staffRecord) return NextResponse.json({ error: "This customer profile is linked to a staff account and cannot be deleted here." }, { status: 403 });
      }
      await audit(auth.admin, auth.user, "customer_data_deleted", "customer", customer.id, { had_login: Boolean(customer.auth_user_id) });
      if (customer.auth_user_id) {
        const userId = customer.auth_user_id;
        const { error: addressesError } = await auth.admin.from("customer_addresses").delete().eq("user_id", userId);
        if (addressesError) return NextResponse.json({ error: addressesError.message }, { status: 400 });
        const { error: cartsError } = await auth.admin.from("abandoned_carts").delete().eq("user_id", userId);
        if (cartsError) return NextResponse.json({ error: cartsError.message }, { status: 400 });
        const { error: returnsError } = await auth.admin.from("return_requests").delete().eq("user_id", userId);
        if (returnsError) return NextResponse.json({ error: returnsError.message }, { status: 400 });
        const { error: reviewsError } = await auth.admin.from("product_reviews").delete().eq("user_id", userId);
        if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 400 });
      }
      const { error: anonymizeError } = await auth.admin.from("orders").update({
        customer_id: null, customer_name: "Deleted customer", email: null, phone: "", shipping_address: {}
      }).eq("customer_id", customer.id);
      if (anonymizeError) return NextResponse.json({ error: anonymizeError.message }, { status: 400 });
      const { error: customerError } = await auth.admin.from("customers").delete().eq("id", customer.id);
      if (customerError) return NextResponse.json({ error: customerError.message }, { status: 400 });
      if (customer.auth_user_id) {
        const { error: authDeleteError } = await auth.admin.auth.admin.deleteUser(customer.auth_user_id);
        if (authDeleteError) return NextResponse.json({ error: "Customer data was removed, but the sign-in account could not be deleted. " + authDeleteError.message }, { status: 409 });
      }
      return NextResponse.json({ ok: true, message: "Customer profile and personal account data deleted. Order financial records, if any, were retained with customer details anonymized." });
    }

    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin request failed." }, { status: 500 });
  }
}
