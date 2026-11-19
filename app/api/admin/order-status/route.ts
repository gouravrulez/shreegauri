import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  // The preview project shares the live Supabase database. Never let a preview
  // status control mutate a real order or send a real customer email.
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({
      ok: false,
      preview_only: true,
      error: "Order status changes are disabled in preview to protect live orders.",
    }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const order_id = String(body?.order_id || "");
  const order_status = String(body?.order_status || "").toLowerCase();
  if (!order_id || !["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled"].includes(order_status)) {
    return NextResponse.json({ error: "Choose a valid order and status." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
  const response = await fetch(`${supabaseUrl}/functions/v1/order-status-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      ...(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } : {}),
    },
    body: JSON.stringify({ order_id, order_status }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  return NextResponse.json(result, { status: response.status });
}
