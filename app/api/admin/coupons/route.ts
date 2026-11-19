import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
const PRIMARY_ADMIN_USER_ID = "42dcd32a-2ec6-406c-8be3-703237a33d0d";

async function authorize(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return { response: NextResponse.json({ error: "Admin service is not configured." }, { status: 503 }) };
  const admin = createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 }) };
  if (data.user.id !== PRIMARY_ADMIN_USER_ID) return { response: NextResponse.json({ error: "Only the primary main administrator can manage coupons." }, { status: 403 }) };
  return { admin, user: data.user };
}

async function listCoupons(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin.from("promo_codes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function GET(request: Request) {
  try {
    const auth = await authorize(request);
    if ("response" in auth) return auth.response;
    const coupons = await listCoupons(auth.admin);
    return NextResponse.json({ ok: true, coupons });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load coupons." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize(request);
    if ("response" in auth) return auth.response;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");
    const id = String(body?.id || "");

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
      const { error } = await auth.admin.from("promo_codes").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, coupons: await listCoupons(auth.admin) });
    }

    if (action === "toggle") {
      if (!id) return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
      const { data: current, error: readError } = await auth.admin.from("promo_codes").select("is_active").eq("id", id).maybeSingle();
      if (readError || !current) return NextResponse.json({ error: readError?.message || "Coupon not found." }, { status: 404 });
      const { error } = await auth.admin.from("promo_codes").update({ is_active: !current.is_active, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, coupons: await listCoupons(auth.admin) });
    }

    if (action !== "save") return NextResponse.json({ error: "Unsupported coupon action." }, { status: 400 });
    const input = body?.coupon || {};
    const code = String(input.code || "").trim().toUpperCase().replace(/\\s+/g, "");
    const discountType = input.discount_type === "fixed" ? "fixed" : "percentage";
    const discountValue = Number(input.discount_value);
    const minOrder = Number(input.min_order_inr || 0);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return NextResponse.json({ error: "Coupon code must be 3–32 letters, numbers, hyphens or underscores." }, { status: 400 });
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percentage" && discountValue > 100)) return NextResponse.json({ error: "Enter a valid discount value. Percentage discounts cannot exceed 100%." }, { status: 400 });
    if (!Number.isFinite(minOrder) || minOrder < 0) return NextResponse.json({ error: "Minimum order must be zero or more." }, { status: 400 });

    const payload: Record<string, unknown> = {
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_inr: minOrder,
      max_discount_inr: input.max_discount_inr === null || input.max_discount_inr === "" ? null : Number(input.max_discount_inr),
      starts_at: input.starts_at || null,
      ends_at: input.ends_at || null,
      max_uses: input.max_uses ? Number(input.max_uses) : null,
      per_customer_limit: input.per_customer_limit ? Number(input.per_customer_limit) : null,
      is_active: Boolean(input.is_active),
      is_public: Boolean(input.is_public),
      show_on_dashboard: Boolean(input.show_on_dashboard),
      applies_to: ["all", "products", "categories"].includes(input.applies_to) ? input.applies_to : "all",
      product_ids: Array.isArray(input.product_ids) ? input.product_ids : [],
      category_ids: Array.isArray(input.category_ids) ? input.category_ids : [],
      updated_at: new Date().toISOString(),
    };
    if (payload.max_discount_inr !== null && (!Number.isFinite(Number(payload.max_discount_inr)) || Number(payload.max_discount_inr) < 0)) return NextResponse.json({ error: "Maximum discount must be zero or more." }, { status: 400 });
    if (payload.max_uses !== null && (!Number.isInteger(Number(payload.max_uses)) || Number(payload.max_uses) < 1)) return NextResponse.json({ error: "Usage limit must be a positive whole number." }, { status: 400 });
    if (payload.per_customer_limit !== null && (!Number.isInteger(Number(payload.per_customer_limit)) || Number(payload.per_customer_limit) < 1)) return NextResponse.json({ error: "Per-customer limit must be a positive whole number." }, { status: 400 });

    const query = id
      ? auth.admin.from("promo_codes").update(payload).eq("id", id)
      : auth.admin.from("promo_codes").insert(payload);
    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, coupons: await listCoupons(auth.admin) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save coupon." }, { status: 500 });
  }
}
