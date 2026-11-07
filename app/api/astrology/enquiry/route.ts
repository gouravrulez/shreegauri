import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
export async function POST(request: Request) {
  let enquiryId = "";
  try {
    const body = await request.json().catch(() => ({}));
    if (String(body?.website || "").trim()) return NextResponse.json({ ok: true });
    const full_name = String(body?.full_name || "").trim();
    const mobile = String(body?.mobile || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const address = String(body?.address || "").trim();
    const service = String(body?.service || "").trim();
    const preferred_time = String(body?.preferred_time || "").trim().slice(0, 160);
    const details = String(body?.details || "").trim().slice(0, 2000);
    if (full_name.length < 2 || full_name.length > 120 || mobile.length < 7 || mobile.length > 25 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || address.length < 5 || address.length > 500 || service.length < 2 || service.length > 120) {
      return NextResponse.json({ ok: false, error: "Please check your name, mobile, email, address and consultation type." }, { status: 400 });
    }
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Enquiry service is not configured.");
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: settings, error: settingsError } = await db.from("site_settings").select("astrology_services").eq("id", 1).single();
    if (settingsError) throw settingsError;
    const activeServices = Array.isArray(settings?.astrology_services) ? settings.astrology_services.filter((s: any) => s?.active !== false) : [];
    if (!activeServices.some((s: any) => String(s?.name || "").trim() === service) && service !== "Both consultations") {
      return NextResponse.json({ ok: false, error: "Please select one of the currently available consultation services." }, { status: 400 });
    }
    const { data, error } = await db.from("astrology_enquiries").insert({ full_name, mobile, email, address, service, preferred_time: preferred_time || null, details: details || null }).select("id").single();
    if (error) throw error;
    enquiryId = data.id;
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      await db.from("astrology_enquiries").update({ email_status: "not_configured" }).eq("id", enquiryId);
      return NextResponse.json({ ok: true, email_sent: false, message: "Your enquiry is saved. Our team will contact you." });
    }
    const from = process.env.ORDER_EMAIL_FROM || "Shree Gauri <orders@shreegauri.in>";
    const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#35252a"><h2>New Astrology Consultation Enquiry</h2>
      <p><b>Name:</b> ${escapeHtml(full_name)}</p><p><b>Mobile:</b> ${escapeHtml(mobile)}</p><p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Address:</b> ${escapeHtml(address)}</p><p><b>Consultation:</b> ${escapeHtml(service)}</p>
      <p><b>Preferred time:</b> ${escapeHtml(preferred_time || "Flexible")}</p><p><b>Details:</b><br>${escapeHtml(details || "Not provided")}</p><p>Enquiry ID: ${escapeHtml(enquiryId)}</p></div>`;
    const mail = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: ["gauritechnologiespvt@gmail.com"], reply_to: email, subject: `New astrology enquiry — ${full_name}`, html }) });
    if (!mail.ok) {
      const reason = (await mail.text()).slice(0, 500);
      await db.from("astrology_enquiries").update({ email_status: "failed", email_error: reason }).eq("id", enquiryId);
      return NextResponse.json({ ok: true, email_sent: false, message: "Your enquiry is saved. Our team will contact you." });
    }
    await db.from("astrology_enquiries").update({ email_status: "sent", email_error: null }).eq("id", enquiryId);
    return NextResponse.json({ ok: true, email_sent: true, message: "Your enquiry has been received. Our team will contact you." });
  } catch (error) {
    console.error("Astrology enquiry submission failed", { enquiryId, error });
    return NextResponse.json({ ok: false, error: "We could not submit your enquiry just now. Please try again shortly." }, { status: 500 });
  }
}
