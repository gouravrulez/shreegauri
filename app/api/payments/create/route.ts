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

    const created = await admin.rpc("create_store_order", { payload: authenticatedPayload });
    if (created.error) throw new Error(created.error.message);
    storeOrder = created.data;

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
