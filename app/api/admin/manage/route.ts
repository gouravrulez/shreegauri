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
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const serviceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!serviceConfigured) {
      const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0J2bflpzARaNejs8jFwDcA_Izlmpdwj";
      const userClient = createClient(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: "Bearer " + token } },
      });
      const { data, error } = await userClient.auth.getUser(token);
      if (error || !data.user) return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
      const { data: roleRow, error: roleError } = await userClient.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
      if (roleError) return NextResponse.json({ error: "Unable to verify staff permissions." }, { status: 500 });
      if (!roleRow?.role) return NextResponse.json({ error: "This account has no Shree Gauri staff access." }, { status: 403 });
      return NextResponse.json({ role: String(roleRow.role), staff: [], is_primary_admin: data.user.id === PRIMARY_ADMIN_USER_ID, needs_password_setup: data.user.user_metadata?.staff_password_setup === true, service_configured: false });
    }
    const auth = await authorized(request);
    if ("error" in auth) return auth.error;
    const needsPasswordSetup = auth.user.user_metadata?.staff_password_setup === true;
    const isPrimaryAdmin = auth.user.id === PRIMARY_ADMIN_USER_ID;
    const staff = isPrimaryAdmin ? await listStaff(auth.admin) : [];
    let shipping_companies: any[] = [];
    let shipping_settings: any = null;
    let coupons: any[] = [];
    if (isPrimaryAdmin) {
      const [companiesResult, settingsResult, couponsResult] = await Promise.all([
        auth.admin.from("shipping_companies").select("*").order("name"),
        auth.admin.from("shipping_settings").select("*").eq("id", 1).maybeSingle(),
        auth.admin.from("promo_codes").select("*").order("created_at", { ascending: false }),
      ]);
      if (companiesResult.error || settingsResult.error || couponsResult.error) {
        return NextResponse.json({ error: "Shipping or coupon settings could not be loaded." }, { status: 500 });
      }
      shipping_companies = companiesResult.data || [];
      shipping_settings = settingsResult.data;
      coupons = couponsResult.data || [];
    }
    return NextResponse.json({ role: auth.role, staff, is_primary_admin: isPrimaryAdmin, needs_password_setup: needsPasswordSetup, service_configured: true, shipping_companies, shipping_settings, coupons });
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

    if (action === "save_shipping_company") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can manage courier companies." }, { status: 403 });
      const id = String(body?.id || "");
      const row = {
        name: String(body?.name || "").trim(),
        tracking_url_template: String(body?.tracking_url_template || "").trim() || null,
        default_charge_inr: Math.max(0, Number(body?.default_charge_inr || 0)),
        estimated_min_days: Math.max(0, Number(body?.estimated_min_days || 0)),
        estimated_max_days: Math.max(0, Number(body?.estimated_max_days || 0)),
        is_active: body?.is_active !== false,
        updated_at: new Date().toISOString()
      };
      if (!row.name) return NextResponse.json({ error: "Enter the courier company name." }, { status: 400 });
      if (row.estimated_max_days < row.estimated_min_days) return NextResponse.json({ error: "Maximum delivery days must be equal to or greater than minimum days." }, { status: 400 });
      const result = id
        ? await auth.admin.from("shipping_companies").update(row).eq("id", id).select().single()
        : await auth.admin.from("shipping_companies").insert(row).select().single();
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
      await audit(auth.admin, auth.user, "shipping_company_saved", "shipping_company", result.data.id, { name: row.name });
      return NextResponse.json({ ok: true, message: "Courier company saved." });
    }

    if (action === "delete_shipping_company") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can manage courier companies." }, { status: 403 });
      const id = String(body?.id || "");
      if (!id) return NextResponse.json({ error: "Courier company not found." }, { status: 400 });
      const { error } = await auth.admin.from("shipping_companies").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await audit(auth.admin, auth.user, "shipping_company_archived", "shipping_company", id);
      return NextResponse.json({ ok: true, message: "Courier company archived. Existing order tracking history was preserved." });
    }

    if (action === "save_shipping_settings") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can change shipping settings." }, { status: 403 });
      const row = {
        default_shipping_charge_inr: Math.max(0, Number(body?.default_shipping_charge_inr || 0)),
        free_shipping_enabled: body?.free_shipping_enabled === true,
        free_shipping_threshold_inr: body?.free_shipping_threshold_inr === "" || body?.free_shipping_threshold_inr == null ? null : Math.max(0, Number(body.free_shipping_threshold_inr)),
        default_min_delivery_days: Math.max(0, Number(body?.default_min_delivery_days || 0)),
        default_max_delivery_days: Math.max(0, Number(body?.default_max_delivery_days || 0)),
        updated_at: new Date().toISOString()
      };
      if (row.default_max_delivery_days < row.default_min_delivery_days) return NextResponse.json({ error: "Maximum delivery days must be equal to or greater than minimum days." }, { status: 400 });
      const { error } = await auth.admin.from("shipping_settings").update(row).eq("id", 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await audit(auth.admin, auth.user, "shipping_settings_saved", "shipping_settings", "1", row);
      return NextResponse.json({ ok: true, message: "Shipping settings saved." });
    }

    if (action === "save_coupon") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can manage coupons." }, { status: 403 });
      const id = String(body?.id || "");
      const code = String(body?.code || "").trim().toUpperCase().replace(/\s+/g, "");
      const discount_type = String(body?.discount_type || "percentage");
      const discount_value = Number(body?.discount_value || 0);
      const applies_to = String(body?.applies_to || "all");
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return NextResponse.json({ error: "Coupon code must be 3–30 letters or numbers." }, { status: 400 });
      if (!["percentage", "fixed"].includes(discount_type) || discount_value <= 0 || (discount_type === "percentage" && discount_value > 100)) return NextResponse.json({ error: "Enter a valid discount." }, { status: 400 });
      if (!["all", "products", "categories"].includes(applies_to)) return NextResponse.json({ error: "Choose a valid coupon scope." }, { status: 400 });
      const row = {
        code, discount_type, discount_value,
        min_order_inr: Math.max(0, Number(body?.min_order_inr || 0)),
        max_discount_inr: body?.max_discount_inr === "" || body?.max_discount_inr == null ? null : Math.max(0, Number(body.max_discount_inr)),
        starts_at: body?.starts_at || null, ends_at: body?.ends_at || null,
        max_uses: body?.max_uses === "" || body?.max_uses == null ? null : Math.max(1, Number(body.max_uses)),
        per_customer_limit: body?.per_customer_limit === "" || body?.per_customer_limit == null ? null : Math.max(1, Number(body.per_customer_limit)),
        is_active: body?.is_active !== false, is_public: body?.is_public === true,
        show_on_dashboard: body?.show_on_dashboard === true, applies_to,
        product_ids: Array.isArray(body?.product_ids) ? body.product_ids : [],
        category_ids: Array.isArray(body?.category_ids) ? body.category_ids : [],
        updated_at: new Date().toISOString()
      };
      if (row.starts_at && row.ends_at && new Date(row.ends_at) < new Date(row.starts_at)) return NextResponse.json({ error: "Coupon end date must be after its start date." }, { status: 400 });
      const result = id
        ? await auth.admin.from("promo_codes").update(row).eq("id", id).select().single()
        : await auth.admin.from("promo_codes").insert(row).select().single();
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
      await audit(auth.admin, auth.user, "coupon_saved", "coupon", result.data.id, { code, discount_type, discount_value, is_public: row.is_public, show_on_dashboard: row.show_on_dashboard });
      return NextResponse.json({ ok: true, message: "Coupon saved." });
    }

    if (action === "delete_coupon") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can delete coupons." }, { status: 403 });
      const id = String(body?.id || "");
      const { data: coupon, error: findError } = await auth.admin.from("promo_codes").select("code").eq("id", id).maybeSingle();
      if (findError || !coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
      await audit(auth.admin, auth.user, "coupon_deleted", "coupon", id, { code: coupon.code });
      const { error } = await auth.admin.from("promo_codes").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, message: "Coupon deleted." });
    }

    if (action === "save_order_shipping") {
      if (!isPrimaryAdmin) return NextResponse.json({ error: "Only the primary main administrator can update courier and tracking details." }, { status: 403 });
      const id = String(body?.id || "");
      if (!id) return NextResponse.json({ error: "Order not found." }, { status: 400 });
      const row = {
        courier_company_id: body?.courier_company_id || null,
        courier_name: String(body?.courier_name || "").trim() || null,
        tracking_number: String(body?.tracking_number || "").trim() || null,
        tracking_url: String(body?.tracking_url || "").trim() || null,
        courier_charge_inr: Math.max(0, Number(body?.courier_charge_inr || 0)),
        dispatch_date: body?.dispatch_date || null,
        expected_delivery_date: body?.expected_delivery_date || null,
        tracking_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data: order, error: findError } = await auth.admin.from("orders").select("id,order_number,customer_name,email").eq("id", id).maybeSingle();
      if (findError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      const { error } = await auth.admin.from("orders").update(row).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await audit(auth.admin, auth.user, "order_tracking_updated", "order", id, { courier_name: row.courier_name, tracking_number: row.tracking_number, expected_delivery_date: row.expected_delivery_date });
      let email_sent = false;
      let email_warning = "";
      const resendKey = process.env.RESEND_API_KEY;
      if (order.email && resendKey && (row.tracking_number || row.tracking_url || row.expected_delivery_date)) {
        const safe = (value: unknown) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        const trackingLink = row.tracking_url ? '<p><a href="' + safe(row.tracking_url) + '">Track your shipment</a></p>' : "";
        const emailBody = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#3b171d"><h1>Your Shree Gauri order is on its way</h1><p>Namaste ' + safe(order.customer_name) + ',</p><p>Courier: <strong>' + safe(row.courier_name || "To be confirmed") + '</strong></p><p>Tracking number: <strong>' + safe(row.tracking_number || "Pending") + '</strong></p>' + trackingLink + '<p>Expected delivery: <strong>' + safe(row.expected_delivery_date || "To be confirmed") + '</strong></p><p>Order: <strong>' + safe(order.order_number) + '</strong></p><p>Thank you for choosing Shree Gauri.</p></div>';
        const mail = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + resendKey, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.ORDER_EMAIL_FROM || "Shree Gauri <orders@shreegauri.in>", to: [order.email], subject: "Shipping update — " + order.order_number, html: emailBody }) });
        email_sent = mail.ok;
        if (!mail.ok) email_warning = "Courier details saved, but the customer email could not be sent.";
      } else if (order.email && !resendKey) {
        email_warning = "Courier details saved. Email service is not configured.";
      }
      return NextResponse.json({ ok: true, email_sent, message: email_sent ? "Courier and tracking details saved. Customer email sent." : (email_warning || "Courier and tracking details saved.") });
    }

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
      let linkedStaffAccount = false;
      if (customer.auth_user_id) {
        const { data: staffRecord, error: staffLookupError } = await auth.admin
          .from("admin_users")
          .select("role")
          .eq("user_id", customer.auth_user_id)
          .maybeSingle();
        if (staffLookupError) {
          return NextResponse.json({ error: "Unable to verify whether this login is a staff account. No customer data was deleted." }, { status: 500 });
        }
        linkedStaffAccount = Boolean(staffRecord);
      }
      await audit(auth.admin, auth.user, "customer_data_deleted", "customer", customer.id, {
        had_login: Boolean(customer.auth_user_id),
        linked_staff_account: linkedStaffAccount
      });
      // A customer profile may share a login with a staff member. Remove the
      // customer record and anonymize linked orders, but never remove staff
      // authentication, addresses, carts, reviews, or other staff-linked data.
      if (customer.auth_user_id && !linkedStaffAccount) {
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
      if (customer.auth_user_id && !linkedStaffAccount) {
        const { error: authDeleteError } = await auth.admin.auth.admin.deleteUser(customer.auth_user_id);
        if (authDeleteError) return NextResponse.json({ error: "Customer data was removed, but the sign-in account could not be deleted. " + authDeleteError.message }, { status: 409 });
      }
      return NextResponse.json({
        ok: true,
        message: linkedStaffAccount
          ? "Customer profile deleted and linked order details anonymized. The staff login and staff data were kept intact."
          : "Customer profile and personal account data deleted. Order financial records, if any, were retained with customer details anonymized."
      });
    }

    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin request failed." }, { status: 500 });
  }
}
