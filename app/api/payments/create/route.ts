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

    const authenticatedPayload = {
      ...payload,
      authenticated_user_id: authUser.id,
      customer: {
        ...(payload?.customer || {}),
        email: authUser.email || payload?.customer?.email || "",
        phone: authUser.phone || payload?.customer?.phone || "",
      },
    };

    const orderLines = Array.isArray(payload?.items) ? payload.items : [];
    const promoCode = String(payload?.promo_code || "").trim().toUpperCase();
    if (promoCode) {
      const { data: promo, error: promoError } = await admin.from("promo_codes").select("*").eq("code", promoCode).eq("is_active", true).maybeSingle();
      if (promoError) throw new Error("Could not validate this coupon. Please try again.");
      if (!promo) throw new Error("This coupon is invalid or inactive.");
      const now = Date.now();
      if (promo.starts_at && new Date(promo.starts_at).getTime() > now) throw new Error("This coupon is not active yet.");
      if (promo.ends_at && new Date(promo.ends_at).getTime() < now) throw new Error("This coupon has expired.");
      if (promo.per_customer_limit) {
        const { data: customer } = await admin.from("customers").select("id").eq("auth_user_id", authUser.id).maybeSingle();
        if (customer?.id) {
          const { count, error: usageError } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customer.id).eq("coupon_code", promoCode);
          if (usageError) throw new Error("Could not verify your coupon usage limit.");
          if ((count || 0) >= Number(promo.per_customer_limit)) throw new Error("You have already used this coupon the maximum number of times.");
        }
      }
      if (promo.applies_to === "products" || promo.applies_to === "categories") {
        const ids = [...new Set(orderLines.map((line: any) => String(line.product_id || "")).filter(Boolean))];
        const { data: cartProducts, error: cartProductsError } = await admin.from("products").select("id,category_id,category_ids").in("id", ids);
        if (cartProductsError) throw new Error("Could not verify which products this coupon applies to.");
        const productMap = new Map((cartProducts || []).map((product: any) => [product.id, product]));
        const eligible = orderLines.every((line: any) => {
          const product: any = productMap.get(line.product_id);
          if (!product) return false;
          if (promo.applies_to === "products") return (promo.product_ids || []).includes(product.id);
          const categoryIds = [...(product.category_ids || []), ...(product.category_id ? [product.category_id] : [])];
          return categoryIds.some((id: string) => (promo.category_ids || []).includes(id));
        });
        if (!eligible) throw new Error(promo.applies_to === "products" ? "This coupon is valid only when your cart contains its selected products." : "This coupon is valid only when your cart contains products from its selected categories.");
      }
    }

    const created = await admin.rpc("create_store_order", { payload: authenticatedPayload });
    if (created.error) throw new Error(created.error.message);
    storeOrder = created.data;

    // Validate optional services and calculate certificate and shipping charges on the server.
    const productIds = [...new Set(orderLines.map((line: any) => String(line.product_id || "")).filter(Boolean))];
    const [{ data: products, error: productsError }, { data: shippingSettings }] = await Promise.all([
      admin.from("products").select("id,abhimantrit_available,certificate_available,certificate_price_inr,custom_shipping_enabled,custom_shipping_charge_inr").in("id", productIds),
      admin.from("shipping_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (productsError) throw new Error("Could not verify product service options.");
    const productById = new Map((products || []).map((product: any) => [product.id, product]));
    let certificateTotal = 0;
    let customShippingTotal = 0;
    let needsDefaultShipping = false;
    for (const line of orderLines) {
      const product: any = productById.get(line.product_id);
      if (!product) throw new Error("A product in your bag is no longer available.");
      const quantity = Math.max(1, Math.min(10, Number(line.quantity || 1)));
      const abhimantritSelected = Boolean(line.abhimantrit_selected);
      const certificateSelected = Boolean(line.certificate_selected);
      if (abhimantritSelected && !product.abhimantrit_available) throw new Error("Abhimantrit / Energisation is not available for one of the selected products.");
      if (certificateSelected && !product.certificate_available) throw new Error("A certificate is not available for one of the selected products.");
      const certificatePrice = certificateSelected ? Math.max(0, Number(product.certificate_price_inr || 0)) : 0;
      certificateTotal += certificatePrice * quantity;
      const selectedOptions = { variant_id: line.variant_id || null, variant_label: line.variant_label || null, abhimantrit_selected: abhimantritSelected, certificate_selected: certificateSelected };
      let itemUpdate = admin.from("order_items").update({
        abhimantrit_selected: abhimantritSelected,
        abhimantrit_label: "Abhimantrit / Energisation",
        certificate_selected: certificateSelected,
        certificate_price_inr: certificatePrice,
        selected_options: selectedOptions,
      }).eq("order_id", storeOrder.order_id).eq("product_id", line.product_id);
      itemUpdate = line.variant_id ? itemUpdate.eq("variant_id", line.variant_id) : itemUpdate.is("variant_id", null);
      const { error: itemOptionError } = await itemUpdate;
      if (itemOptionError) throw new Error("Could not save the selected product options.");
      if (product.custom_shipping_enabled) customShippingTotal += Math.max(0, Number(product.custom_shipping_charge_inr || 0)) * quantity;
      else needsDefaultShipping = true;
    }
    let shippingTotal = customShippingTotal + (needsDefaultShipping ? Math.max(0, Number(shippingSettings?.default_shipping_charge_inr || 0)) : 0);
    const freeShippingThreshold = Number(shippingSettings?.free_shipping_threshold_inr || 0);
    if (shippingSettings?.free_shipping_enabled && freeShippingThreshold > 0 && Number(storeOrder.subtotal_inr || 0) >= freeShippingThreshold) shippingTotal = 0;
    const certificateAmount = Math.round(certificateTotal * 100) / 100;
    shippingTotal = Math.round(shippingTotal * 100) / 100;
    const discountAmount = Number(storeOrder.discount_inr || 0);
    storeOrder.certificate_inr = certificateAmount;
    storeOrder.shipping_inr = shippingTotal;
    storeOrder.total_inr = Math.max(0, Number(storeOrder.subtotal_inr || 0) + certificateAmount + shippingTotal - discountAmount);
    const { error: totalsError } = await admin.from("orders").update({ certificate_inr: certificateAmount, shipping_inr: shippingTotal, courier_charge_inr: shippingTotal, total_inr: storeOrder.total_inr, coupon_code: payload?.promo_code || null, coupon_discount_inr: discountAmount }).eq("id", storeOrder.order_id);
    if (totalsError) throw new Error("Could not save the final order total. Please contact support before retrying.");

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
