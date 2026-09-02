import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function POST(request: Request) {
  let admin: any = null;
  let storeOrder: any = null;
  try {
    const payload = await request.json();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!serviceKey || !keyId || !keySecret)
      return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });

    admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const created = await admin.rpc("create_store_order", { payload });
    if (created.error) throw new Error(created.error.message);
    storeOrder = created.data;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(Number(storeOrder.total_inr) * 100),
        currency: "INR",
        receipt: storeOrder.order_number,
        notes: { store_order_id: storeOrder.order_id },
      }),
    });
    const razorpayOrder = await response.json();
    if (!response.ok) throw new Error(razorpayOrder?.error?.description || "Unable to start Razorpay payment.");

    await admin.from("orders").update({
      payment_provider: "razorpay",
      payment_reference: razorpayOrder.id,
    }).eq("id", storeOrder.order_id);

    return NextResponse.json({
      key: keyId,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: "INR",
      store_order_id: storeOrder.order_id,
      order_number: storeOrder.order_number,
      reservation_expires_at: storeOrder.reservation_expires_at,
    });
  } catch (error) {
    if (admin && storeOrder?.order_id) {
      try { await admin.rpc("release_order_reservation", { p_order_id: storeOrder.order_id, p_status: "failed" }); } catch {}
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 400 });
  }
}
