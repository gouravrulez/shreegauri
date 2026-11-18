import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPhonePePayment } from "../../../lib/phonepe";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function POST(request: Request) {
  let admin: any = null;
  let storeOrder: any = null;
  try {
    const payload = await request.json();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey)
      return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });

    admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token)
      return NextResponse.json({ error: "Please log in to your Shree Gauri account before checkout." }, { status: 401 });

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const authUser = authData?.user;
    if (authError || !authUser)
      return NextResponse.json({ error: "Your login session has expired. Please log in again." }, { status: 401 });

    const items = Array.isArray(payload?.items) ? payload.items : [];
    const productIds = Array.from(new Set(items.map((item: any) => String(item?.product_id || "")).filter(Boolean)));
    const { data: productRows, error: productError } = productIds.length
      ? await admin.from("products").select("id,category_id,category_ids,custom_shipping_enabled,custom_shipping_charge_inr").in("id", productIds)
      : { data: [], error: null };
    if (productError) throw new Error("Unable to validate cart products.");
    const productsById = new Map((productRows || []).map((product: any) => [product.id, product]));

    const promoCode = String(payload?.promo_code || "").trim().toUpperCase();
    if (promoCode) {
      const { data: promo, error: promoError } = await admin.from("promo_codes").select("*").eq("code", promoCode).maybeSingle();
      if (promoError) throw new Error("Unable to validate the coupon code.");
      const now = Date.now();
      if (!promo || !promo.is_active || (promo.starts_at && new Date(promo.starts_at).getTime() > now) || (promo.ends_at && new Date(promo.ends_at).getTime() < now) || (promo.max_uses != null && Number(promo.usage_count || 0) >= Number(promo.max_uses))) {
        throw new Error("This coupon code is not valid or has expired.");
      }
      if (promo.applies_to === "products" && !items.every((item: any) => (promo.product_ids || []).includes(String(item.product_id)))) {
        throw new Error("This coupon applies only to selected products. Please update your cart.");
      }
      if (promo.applies_to === "categories" && !items.every((item: any) => {
        const product: any = productsById.get(String(item.product_id));
        const memberships = [...(product?.category_ids || []), ...(product?.category_id ? [product.category_id] : [])];
        return memberships.some((id) => (promo.category_ids || []).includes(id));
      })) {
        throw new Error("This coupon applies only to selected categories. Please update your cart.");
      }
      if (promo.per_customer_limit != null) {
        const { data: customer } = await admin.from("customers").select("id").eq("auth_user_id", authUser.id).maybeSingle();
        if (customer?.id) {
          const { count, error: usageError } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customer.id).eq("coupon_code", promoCode);
          if (usageError) throw new Error("Unable to verify this coupon's customer usage limit.");
          if (Number(count || 0) >= Number(promo.per_customer_limit)) throw new Error("This coupon has reached its per-customer usage limit.");
        }
      }
    }

    const authenticatedPayload = {
      ...payload,
      authenticated_user_id: authUser.id,
      customer: {
        ...(payload?.customer || {}),
        email: authUser.email || payload?.customer?.email || "",
        phone: authUser.phone || payload?.customer?.phone || "",
      },
    };

    const created = await admin.rpc("create_store_order", { payload: authenticatedPayload });
    if (created.error) throw new Error(created.error.message);
    storeOrder = created.data;

    const { data: shippingSettings } = await admin.from("shipping_settings").select("*").eq("id", 1).maybeSingle();
    let shippingCharge = Number(shippingSettings?.default_shipping_charge_inr || 0);
    for (const item of items) {
      const product: any = productsById.get(String(item.product_id));
      if (product?.custom_shipping_enabled) {
        shippingCharge += Number(product.custom_shipping_charge_inr || 0) * Math.max(1, Number(item.quantity || 1));
      }
    }
    if (shippingSettings?.free_shipping_enabled && shippingSettings.free_shipping_threshold_inr != null && Number(storeOrder.subtotal_inr || 0) >= Number(shippingSettings.free_shipping_threshold_inr)) {
      shippingCharge = 0;
    }
    const couponDiscount = Number(storeOrder.discount_inr || 0);
    const updatedTotal = Math.max(0, Number(storeOrder.subtotal_inr || 0) - couponDiscount + shippingCharge);
    const orderUpdate: Record<string, unknown> = {
      shipping_inr: shippingCharge,
      total_inr: updatedTotal,
      coupon_code: promoCode || null,
      coupon_discount_inr: couponDiscount,
      updated_at: new Date().toISOString(),
    };
    const { error: orderUpdateError } = await admin.from("orders").update(orderUpdate).eq("id", storeOrder.order_id);
    if (orderUpdateError) throw new Error("Order was created but shipping and coupon totals could not be saved. Please contact support before retrying.");
    storeOrder.total_inr = updatedTotal;
    storeOrder.shipping_inr = shippingCharge;
    storeOrder.coupon_code = promoCode || null;

    const provider = (process.env.PAYMENT_PROVIDER || "razorpay").toLowerCase();

    if (provider === "phonepe") {
      const merchantOrderId = String(storeOrder.order_id);
      const origin = new URL(request.url).origin;
      const redirectUrl = `${origin}/payment-return?store_order_id=${encodeURIComponent(storeOrder.order_id)}`;
      const phonePeOrder = await createPhonePePayment({
        merchantOrderId,
        amountPaise: Math.round(Number(storeOrder.total_inr) * 100),
        redirectUrl,
      });

      if (!phonePeOrder?.redirectUrl) throw new Error("PhonePe did not return a checkout URL.");

      const saved = await admin.from("orders").update({
        payment_provider: "phonepe",
        payment_reference: merchantOrderId,
      }).eq("id", storeOrder.order_id);
      if (saved.error) throw new Error(saved.error.message);

      return NextResponse.json({
        provider: "phonepe",
        redirect_url: phonePeOrder.redirectUrl,
        phonepe_order_id: phonePeOrder.orderId || null,
        store_order_id: storeOrder.order_id,
        order_number: storeOrder.order_number,
        reservation_expires_at: storeOrder.reservation_expires_at,
      });
    }

    return NextResponse.json({ error: "Only PhonePe checkout is currently enabled." }, { status: 503 });
  } catch (error) {
    if (admin && storeOrder?.order_id) {
      try {
        await admin.rpc("release_order_reservation", {
          p_order_id: storeOrder.order_id,
          p_status: "failed",
        });
      } catch {}
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create order." },
      { status: 400 },
    );
  }
}
