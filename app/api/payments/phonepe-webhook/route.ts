import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validatePhonePeCallback } from "../../../lib/phonepe";
import { notifyPaidOrder } from "../../../lib/order-notifications";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey)
      return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

    const rawBody = await request.text();
    const authorization = request.headers.get("authorization");
    if (!validatePhonePeCallback(authorization)) {
      return NextResponse.json({ error: "Invalid callback." }, { status: 401 });
    }

    const body = JSON.parse(rawBody || "{}");
    const payload = body?.payload || {};
    const merchantOrderId = String(payload?.merchantOrderId || "");
    const state = String(payload?.state || "").toUpperCase();
    if (!merchantOrderId) return NextResponse.json({ ok: true });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: order } = await admin
      .from("orders")
      .select("id,payment_status")
      .eq("payment_provider", "phonepe")
      .eq("payment_reference", merchantOrderId)
      .maybeSingle();
    if (!order) return NextResponse.json({ ok: true });

    if (state === "COMPLETED") {
      const { data, error } = await admin.rpc("finalize_paid_order", {
        p_order_id: order.id,
        p_payment_reference: merchantOrderId,
      });
      if (error) throw new Error(error.message);
      if (!data?.already_paid) {
        try {
          await notifyPaidOrder(admin, String(order.id));
        } catch (e) {
          console.warn("Paid order notification error:", e);
        }
      }
    } else if (["FAILED", "CANCELLED", "EXPIRED"].includes(state) && order.payment_status !== "paid") {
      await admin.rpc("release_order_reservation", {
        p_order_id: order.id,
        p_status: "failed",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PhonePe webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 400 });
  }
}
