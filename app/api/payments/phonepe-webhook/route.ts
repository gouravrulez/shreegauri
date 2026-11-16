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
    const merchantOrderId = String(payload?.merchantOrderId || payload?.originalMerchantOrderId || "");
    const state = String(payload?.state || "").toUpperCase();
    if (!merchantOrderId) return NextResponse.json({ ok: true });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: order } = await admin
      .from("orders")
      .select("id,payment_status")
      .eq("payment_provider", "phonepe")
      .eq("id", merchantOrderId)
      .maybeSingle();
    if (!order) return NextResponse.json({ ok: true });

    if (state === "COMPLETED")¶»§q«^