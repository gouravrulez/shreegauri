import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
const primaryAdmin = "42dcd32a-2ec6-406c-8be3-703237a33d0d";
function db() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Admin service is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function staff(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) } as const;
  const client = db();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 }) } as const;
  const { data: role } = await client.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!role || !["admin", "manager", "support"].includes(String(role.role))) return { error: NextResponse.json({ error: "You do not have access to astrology enquiries." }, { status: 403 }) } as const;
  return { client, user: data.user, role: String(role.role) } as const;
}
export async function GET(request: Request) {
  try {
    const auth = await staff(request);
    if ("error" in auth) return auth.error;
    const [{ data: enquiries, error }, { data: settings, error: settingsError }] = await Promise.all([
      auth.client.from("astrology_enquiries").select("*").order("created_at", { ascending: false }).limit(500),
      auth.client.from("site_settings").select("astrology_services").eq("id", 1).single()
    ]);
    if (error) throw error;
    if (settingsError) throw settingsError;
    return NextResponse.json({ enquiries: enquiries || [], services: Array.isArray(settings?.astrology_services) ? settings.astrology_services : [] });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to load astrology data." }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    const auth = await staff(request);
    if ("error" in auth) return auth.error;
    const body = await request.json().catch(() => ({}));
    if (body.action === "update_status") {
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!id || !["new", "contacted", "in_progress", "completed", "closed"].includes(status)) return NextResponse.json({ error: "Invalid enquiry update." }, { status: 400 });
      const { error } = await auth.client.from("astrology_enquiries").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Enquiry status updated." });
    }
    if (body.action === "save_services") {
      if (auth.role !== "admin" || auth.user.id !== primaryAdmin) return NextResponse.json({ error: "Only the primary administrator can edit consultation services." }, { status: 403 });
      const services = Array.isArray(body.services) ? body.services : [];
      if (services.length > 20) return NextResponse.json({ error: "You can add up to 20 consultation services." }, { status: 400 });
      const clean = services.map((s: any) => ({ name: String(s.name || "").trim().slice(0, 100), description: String(s.description || "").trim().slice(0, 500), active: s.active !== false })).filter((s: any) => s.name.length >= 2);
      if (!clean.some((s: any) => s.active)) return NextResponse.json({ error: "Keep at least one consultation service visible on the website." }, { status: 400 });
      const { error } = await auth.client.from("site_settings").update({ astrology_services: clean, updated_at: new Date().toISOString() }).eq("id", 1);
      if (error) throw error;
      return NextResponse.json({ ok: true, services: clean, message: "Consultation services saved." });
    }
    return NextResponse.json({ error: "Unknown astrology action." }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Astrology update failed." }, { status: 500 }); }
}
