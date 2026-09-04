import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";
const publishableKey = "sb_publishable_0J2bflpzARaNejs8jFwDcA_Izlmpdwj";

function hashCode(secret: string, challengeId: string, code: string) {
  return createHmac("sha256", secret).update(`${challengeId}:${code}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();
    const challengeId = String(body?.challenge_id || "").trim();

    if (!email || !challengeId || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the valid 6-digit verification code." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Authentication service is not configured." }, { status: 503 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "private" },
    });

    const found = await admin
      .from("email_otp_challenges")
      .select("*")
      .eq("id", challengeId)
      .ilike("email", email)
      .maybeSingle();

    const challenge: any = found.data;
    if (found.error || !challenge || challenge.used_at) {
      return NextResponse.json({ error: "This verification code is invalid or has already been used." }, { status: 400 });
    }
    if (new Date(challenge.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This verification code has expired. Request a new code." }, { status: 400 });
    }
    if (Number(challenge.attempts || 0) >= 5) {
      return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
    }

    const expected = String(challenge.code_hash);
    const actual = hashCode(serviceKey, challengeId, code);
    if (!safeEqual(expected, actual)) {
      await admin.from("email_otp_challenges")
        .update({ attempts: Number(challenge.attempts || 0) + 1 })
        .eq("id", challengeId);
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
    }

    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (users.error) throw users.error;
    let user = users.data.users.find((u) => String(u.email || "").toLowerCase() === email);

    if (!user) {
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: challenge.full_name ? { full_name: challenge.full_name } : undefined,
      });
      if (created.error) throw created.error;
      user = created.data.user;
    } else {
      const metadata = challenge.full_name
        ? { ...(user.user_metadata || {}), full_name: challenge.full_name }
        : user.user_metadata;
      const updated = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
        user_metadata: metadata,
      });
      if (updated.error) throw updated.error;
      user = updated.data.user;
    }

    const generated = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (generated.error) throw generated.error;
    const tokenHash = String((generated.data?.properties as any)?.hashed_token || "");
    if (!tokenHash) throw new Error("Unable to establish the login session.");

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const verified = await authClient.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (verified.error || !verified.data.session) {
      throw verified.error || new Error("Unable to establish the login session.");
    }

    await admin.from("email_otp_challenges")
      .update({ used_at: new Date().toISOString() })
      .eq("id", challengeId);

    return NextResponse.json({
      ok: true,
      session: {
        access_token: verified.data.session.access_token,
        refresh_token: verified.data.session.refresh_token,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify code." },
      { status: 400 },
    );
  }
}
