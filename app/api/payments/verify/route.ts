import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyPaidOrder } from "../../../lib/order-notifications";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secret || !serviceKey) {
      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 503 }
      );
    }

    const expected = createHmac("sha256", secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    const actual = String(body.razorpay_signature || "");

    if (
      expected.length !== actual.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
    ) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.rpc("finalize_paid_order", {
      p_order_id: body.store_order_id,
      p_payment_reference: body.razorpay_payment_id,
    });

    if (error) throw new Error(error.message);

    // Notifications are deliberately non-blocking for payment success.
    // A temporary email/WhatsApp provider failure must never convert a
    // successfully verified customer payment into a failed checkout.
    try {
      await notifyPaidOrder(admin, String(body.store_order_id));
    } catch (notificationError) {
      console.warn("Paid order notification error:", notificationError);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
      },
      { status: 400 }
    );
  }
}
