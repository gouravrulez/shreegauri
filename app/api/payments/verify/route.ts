import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyPaidOrder } from "../../../lib/order-notifications";
const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret || !keyId || !serviceKey)
      return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });

    const expected = createHmac("sha256", secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest("hex");
    const actual = String(body.razorpay_signature || "");
    if (expected.length !== actual.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual)))
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from("orders")
      .select("id,payment_status,payment_reference").eq("id", body.store_order_id).single();
    if (orderError || !order) throw new Error("Order not found.");
    if (order.payment_status === "paid")
      return NextResponse.json({ order_id: order.id, status: "confirmed", already_paid: true });
    if (order.payment_reference !== body.razorpay_order_id)
      throw new Error("Payment order does not match this store order.");

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}` },
      cache: "no-store",
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok) throw new Error("Unable to confirm payment with Razorpay.");
    if (payment.order_id !== body.razorpay_order_id) throw new Error("Razorpay payment/order mismatch.");
    if (!["captured"].includes(String(payment.status))) throw new Error(`Payment is not captured yet (${payment.status || "unknown"}).`);

    const { data, error } = await admin.rpc("finalize_paid_order", {
      p_order_id: body.store_order_id, p_payment_reference: body.razorpay_payment_id,
    });
    if (error) throw new Error(error.message);
    if (!data?.already_paid) {
      try { await notifyPaidOrder(admin, String(body.store_order_id)); }
      catch (e) { console.warn("Paid order notification error:", e); }
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to verify payment." }, { status: 400 });
  }
}
