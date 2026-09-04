import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

async function sendOtpEmail(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM || "Shree Gauri <orders@shreegauri.in>";

  if (!key) throw new Error("Email service is not configured.");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#3f2622">
      <h2 style="margin:0 0 18px">Welcome to Shree Gauri</h2>
      <p>Use the verification code below to securely sign in to your Shree Gauri account:</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#5c151c">${code}</div>
      <p>Enter this code on the Shree Gauri website to continue.</p>
      <p style="margin-top:24px">If you did not request this code, you can safely ignore this email.</p>
      <p style="margin-top:26px">Regards,<br><strong>Shree Gauri</strong><br>Jewellery · Gemstones · Spiritual</p>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Shree Gauri Verification Code",
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to send verification email (${response.status}).`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.full_name || "").trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Authentication service is not configured." },
        { status: 503 },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const options = fullName ? { data: { full_name: fullName } } : undefined;

    // Supabase admin.generateLink explicitly creates a magic-link/OTP token
    // without using the hosted email template. We send the returned raw
    // six-digit OTP ourselves through the already configured Resend account.
    let generated = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options,
    });

    if (generated.error) {
      // generateLink normally creates the user for magiclink. If an older
      // unverified record prevents that flow, make it usable for passwordless
      // OTP and retry. No session is issued here; the customer still must
      // enter the emailed OTP to authenticate.
      const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = users.data?.users?.find(
        (u) => String(u.email || "").toLowerCase() === email,
      );

      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          email_confirm: true,
          user_metadata: fullName
            ? { ...(existing.user_metadata || {}), full_name: fullName }
            : existing.user_metadata,
        });
      } else {
        const created = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: fullName ? { full_name: fullName } : undefined,
        });
        if (created.error) throw created.error;
      }

      generated = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options,
      });
    }

    if (generated.error) throw generated.error;

    const code = String(generated.data?.properties?.email_otp || "").trim();

    if (!/^\d{6}$/.test(code)) {
      throw new Error("Supabase did not generate a valid six-digit OTP.");
    }

    await sendOtpEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send verification code.",
      },
      { status: 400 },
    );
  }
}
