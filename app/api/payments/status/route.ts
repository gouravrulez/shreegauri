import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPhonePeOrderStatus } from "../../../lib/phonepe";
import { notifyPaidOrder } from "../../../lib/order-notifications";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function GET(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey)
      return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });

    const storeOrderId = new URL(request.url).searchParams.get("store_order_id");
    if (!storeOrderId)
      return NextResponse.json({ error: "Missing order reference." }, { status: 400 });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,order_number,payment_status,payment_provider,payment_reference")
      .eq("id", storeOrderId)
      .single();
    if (orderError || !order) throw new Error("Order not found.");

    if (order.payment_status === "paid") {
      return NextResponse.json({
        status: "confirmed",
        order_id: order.id,
        order_number: order.order_number,
        already_paid: true,
      });
    }
    if (order.payment_provider !== "phonepe" || !order.payment_reference) {
      throw new Error("This order is not awaiting a PhonePe payment.");
    }

    const phonePeStatus = await getPhonePeOrderStatus(String(order.payment_reference));
    const state = String(phonePeStatus?.state || "").toUpperCase();

    if (state === "COMPLETED") {
      const { data, error } = await admin.rpc("finalize_paid_order", {
        p_order_id: order.id,
        p_payment_reference: String(order.payment_reference),
      });
      if (error) throw new Error(error.message);
      if (!data?.already_paid) {
        try {
          await notifyPaidOrder(admin, String(order.id));
        } catch (e) {
          console.warn("Paid order notification error:", e);
        }
      }
      return NextResponse.json({
        ...data,
        status: "confirmed",
        order_number: order.order_number,
        phonepe_state: state,
      });
    }

    if (["FAILED", "CANCELLED", "EXPIRED"].includes(state)) {
      await admin.rpc("release_order_reservation", {
        p_order_id: order.id,
        p_status: "failed",
      });
      return NextResponse.json({
        status: "failed",
        order_id: order.id,
        order_number: order.order_number,
        phonepe_state: state,
      });
    }

    return NextResponse.json({
      status: "pending",
      order_id: order.id,
      order_number: order.order_number,
      phonepe_state: state || "PENDING",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify payment." },
      { status: 400 },
    );
  }
}
