import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

async function sendOtpEmail(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM || "Shree Gauri <orders@shreegauri.in>";
  if (!key) throw new Error("Email service is not configured.");

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#3f2622">
  <h2>Welcome to Shree Gauri</h2>
  <p>Use the verification code below to securely sign in to your Shree Gauri account:</p>
  <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#5c151c">${code}</div>
  <p>Enter this code on the Shree Gauri website to continue.</p>
  <p>If you did not request this code, you can safely ignore this email.</p>
  <p>Regards,<br><strong>Shree Gauri</strong><br>Jewellery · Gemstones · Spiritual</p></div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Your Shree Gauri Verification Code", html }),
  });
  if (!r.ok) throw new Error(`Unable to send verification email (${r.status}).`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.full_name || "").trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey)
      return NextResponse.json({ error: "Authentication service is not configured." }, { status: 503 });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Ensure an auth user exists and is email-confirmed. The customer must
    // still prove mailbox possession by entering the OTP generated below.
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (users.error) throw users.error;
    let existing = users.data.users.find(u => String(u.email || "").toLowerCase() === email);

    if (!existing) {
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : undefined,
      });
      if (created.error) throw created.error;
      existing = created.data.user;
    } else if (!existing.email_confirmed_at) {
      const updated = await admin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        user_metadata: fullName
          ? { ...(existing.user_metadata || {}), full_name: fullName }
          : existing.user_metadata,
      });
      if (updated.error) throw updated.error;
    }

    const generated = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: fullName ? { data: { full_name: fullName } } : undefined,
    });
    if (generated.error) throw generated.error;

    const props: any = generated.data?.properties || {};
    // Supabase JS/API versions may expose this as email_otp, hashed_token,
    // or only inside action_link. For verifyOtp(type=email), hashed_token is
    // NOT the user-entered OTP, so only use an actual numeric OTP.
    const candidates = [
      props.email_otp,
      props.otp,
      (generated.data as any)?.email_otp,
      (generated.data as any)?.otp,
    ].map(v => String(v || "").trim());

    const code = candidates.find(v => /^\d{6}$/.test(v));
    if (!code) {
      // Return diagnostics without secrets so deployment can be corrected
      // precisely if Supabase changes the response shape again.
      return NextResponse.json({
        error: "OTP generation response did not include a six-digit code.",
        diagnostic: {
          property_keys: Object.keys(props),
          data_keys: Object.keys((generated.data as any) || {}),
        },
      }, { status: 502 });
    }

    await sendOtpEmail(email, code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to send verification code." },
      { status: 400 }
    );
  }
}
