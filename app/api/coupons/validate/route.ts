import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
    if (!key) return NextResponse.json({ error: "Coupon service is not configured." }, { status: 503 });
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return NextResponse.json({ error: "Please sign in before applying a coupon." }, { status: 401 });
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Your login session has expired." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "").trim().toUpperCase();
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!code || !items.length) return NextResponse.json({ error: "Enter a coupon code and add products to your cart." }, { status: 400 });

    const { data: promo, error: promoError } = await admin.from("promo_codes").select("*").eq("code", code).maybeSingle();
    const now = Date.now();
    if (promoError) throw promoError;
    if (!promo || !promo.is_active || (promo.starts_at && new Date(promo.starts_at).getTime() > now) || (promo.ends_at && new Date(promo.ends_at).getTime() < now) || (promo.max_uses != null && Number(promo.usage_count || 0) >= Number(promo.max_uses))) {
      return NextResponse.json({ error: "This coupon code is not valid or has expired." }, { status: 400 });
    }

    const productIds = Array.from(new Set(items.map((item: any) => String(item?.product_id || "")).filter(Boolean)));
    const { data: products, error: productError } = await admin.from("products").select("id,category_id,category_ids,price_inr").in("id", productIds);
    if (productError) throw productError;
    const productMap = new Map((products || []).map((p: any) => [p.id, p]));
    if (productMap.size !== productIds.length) return NextResponse.json({ error: "One or more products in your cart are no longer available." }, { status: 400 });

    if (promo.applies_to === "products" && !items.every((item: any) => (promo.product_ids || []).includes(String(item.product_id)))) {
      return NextResponse.json({ error: "This coupon applies only to selected products. Please update your cart." }, { status: 400 });
    }
    if (promo.applies_to === "categories" && !items.every((item: any) => {
      const p: any = productMap.get(String(item.product_id));
      const memberships = [...(p?.category_ids || []), ...(p?.category_id ? [p.category_id] : [])];
      return memberships.some((id) => (promo.category_ids || []).includes(id));
    })) {
      return NextResponse.json({ error: "This coupon applies only to selected categories. Please update your cart." }, { status: 400 });
    }

    const variantIds = Array.from(new Set(items.map((item: any) => String(item?.variant_id || "")).filter(Boolean)));
    const variantMap = new Map<string, any>();
    if (variantIds.length) {
      const { data: variants, error: variantError } = await admin.from("product_variants").select("id,product_id,price_inr,is_active").in("id", variantIds);
      if (variantError) throw variantError;
      (variants || []).forEach((v: any) => variantMap.set(v.id, v));
    }
    let subtotal = 0;
    for (const item of items) {
      const product: any = productMap.get(String(item.product_id));
      const variant = item.variant_id ? variantMap.get(String(item.variant_id)) : null;
      if (item.variant_id && (!variant || !variant.is_active || variant.product_id !== product.id)) return NextResponse.json({ error: "A selected product option is no longer available." }, { status: 400 });
      const quantity = Math.max(1, Math.min(10, Number(item.quantity || 1)));
      subtotal += Number(variant?.price_inr ?? product.price_inr) * quantity;
    }
    if (subtotal < Number(promo.min_order_inr || 0)) {
      return NextResponse.json({ error: "Minimum order value for this coupon is ₹" + Number(promo.min_order_inr).toLocaleString("en-IN") + "." }, { status: 400 });
    }

    if (promo.per_customer_limit != null) {
      const { data: customer } = await admin.from("customers").select("id").eq("auth_user_id", authData.user.id).maybeSingle();
      if (customer?.id) {
        const { count, error: usageError } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customer.id).eq("coupon_code", code);
        if (usageError) throw usageError;
        if (Number(count || 0) >= Number(promo.per_customer_limit)) return NextResponse.json({ error: "You have reached the usage limit for this coupon." }, { status: 400 });
      }
    }

    let discount = promo.discount_type === "percentage"
      ? Math.round(subtotal * Number(promo.discount_value) / 100 * 100) / 100
      : Math.min(subtotal, Number(promo.discount_value));
    if (promo.max_discount_inr != null) discount = Math.min(discount, Number(promo.max_discount_inr));
    return NextResponse.json({ ok: true, code, subtotal_inr: subtotal, discount_inr: discount, message: "Coupon applied. You save ₹" + Math.round(discount).toLocaleString("en-IN") + "." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to validate coupon." }, { status: 400 });
  }
}
