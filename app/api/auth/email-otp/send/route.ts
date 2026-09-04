import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, randomInt, randomUUID } from "node:crypto";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";

function hashCode(secret: string, challengeId: string, code: string) {
  return createHmac("sha256", secret).update(`${challengeId}:${code}`).digest("hex");
}

async function sendOtpEmail(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM || "Shree Gauri <orders@shreegauri.in>";
  if (!key) throw new Error("Email service is not configured.");

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#3f2622">
    <h2 style="margin:0 0 18px">Welcome to Shree Gauri</h2>
    <p>Use the verification code below to securely sign in to your Shree Gauri account:</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#5c151c">${code}</div>
    <p>Enter this code on the Shree Gauri website to continue.</p>
    <p style="margin-top:24px">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
    <p style="margin-top:26px">Regards,<br><strong>Shree Gauri</strong><br>Jewellery · Gemstones · Spiritual</p>
  </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Shree Gauri Verification Code",
      html,
    }),
  });

  if (!r.ok) throw new Error(`Unable to send verification email (${r.status}).`);
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
      return NextResponse.json({ error: "Authentication service is not configured." }, { status: 503 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "private" },
    });

    const recent = await admin
      .from("email_otp_challenges")
      .select("created_at")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent.data?.created_at) {
      const age = Date.now() - new Date(recent.data.created_at).getTime();
      if (age < 60_000) {
        const seconds = Math.max(1, Math.ceil((60_000 - age) / 1000));
        return NextResponse.json(
          { error: `Please wait ${seconds} seconds before requesting another code.` },
          { status: 429 },
        );
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const challengeId = randomUUID();
    const codeHash = hashCode(serviceKey, challengeId, code);
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

    const created = await admin.from("email_otp_challenges").insert({
      id: challengeId,
      email,
      code_hash: codeHash,
      full_name: fullName || null,
      expires_at: expiresAt,
    });
    if (created.error) throw created.error;

    try {
      await sendOtpEmail(email, code);
    } catch (e) {
      await admin.from("email_otp_challenges").delete().eq("id", challengeId);
      throw e;
    }

    return NextResponse.json({ ok: true, challenge_id: challengeId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send verification code." },
      { status: 400 },
    );
  }
}
