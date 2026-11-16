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
        phone: authUser.phone |¶»§q«^