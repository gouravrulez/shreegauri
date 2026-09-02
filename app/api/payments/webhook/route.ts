import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyPaidOrder } from "../../../lib/order-notifications";
const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(raw);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const payment = event?.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  if (!razorpayOrderId) return NextResponse.json({ ok: true });

  const { data: order } = await admin.from("orders").select("id,payment_status").eq("payment_reference", razorpayOrderId).maybeSingle();
  if (!order) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured") {
    const result = await admin.rpc("finalize_paid_order", { p_order_id: order.id, p_payment_reference: payment.id });
    if (!result.error && !result.data?.already_paid) {
      try { await notifyPaidOrder(admin, order.id); } catch (e) { console.warn("Webhook notification error:", e); }
    }
  } else if (event.event === "payment.failed" && order.payment_status !== "paid") {
    await admin.rpc("release_order_reservation", { p_order_id: order.id, p_status: "failed" });
  }
  return NextResponse.json({ ok: true });
}
