import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
      keyId = process.env.RAZORPAY_KEY_ID,
      keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!serviceKey || !keyId || !keySecret)
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503 },
      );
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: storeOrder, error } = await admin.rpc("create_store_order", {
      payload,
    });
    if (error) throw new Error(error.message);
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
    if (!response.ok)
      throw new Error(
        razorpayOrder?.error?.description ||
          "Unable to start Razorpay payment.",
      );
    await admin
      .from("orders")
      .update({
        payment_provider: "razorpay",
        payment_reference: razorpayOrder.id,
      })
      .eq("id", storeOrder.order_id);
    return NextResponse.json({
      key: keyId,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: "INR",
      store_order_id: storeOrder.order_id,
      order_number: storeOrder.order_number,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create order.",
      },
      { status: 400 },
    );
  }
}
