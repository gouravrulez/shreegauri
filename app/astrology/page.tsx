"use client";

import { useState } from "react";
import type { FormEvent, CSSProperties } from "react";

const BUSINESS_WHATSAPP = "917400617601";

export default function AstrologyConsultationPage() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    service: "Kundali Analysis",
    concern: "",
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = [
      "Astrology consultation request",
      `Name: ${form.name}`,
      `Mobile: ${form.mobile}`,
      `Email: ${form.email}`,
      `Address: ${form.address}`,
      `Service: ${form.service}`,
      `Additional details: ${form.concern || "Not specified"}`,
    ].join("\n");
    window.location.href = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  return (
    <main style={{ minHeight: "75vh", background: "#fbf7ef", padding: "clamp(24px, 5vw, 64px) 18px", color: "#35252a" }}>
      <section style={{ maxWidth: 760, margin: "0 auto", background: "#fffdf8", border: "1px solid #e8dcc5", borderRadius: 18, padding: "clamp(22px, 5vw, 46px)", boxShadow: "0 12px 40px rgba(54,35,28,.08)" }}>
        <p style={{ color: "#9b762e", letterSpacing: ".16em", fontSize: 12, fontWeight: 700, margin: 0 }}>SHREE GAURI · ASTROLOGY SERVICES</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px, 5vw, 44px)", margin: "12px 0" }}>Kundali Analysis &amp; Gemstone Consultation</h1>
        <p style={{ lineHeight: 1.7, color: "#66585b", marginBottom: 28 }}>Choose the service you are interested in and share your contact details. Our team will follow up with you to discuss the consultation.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
          <div style={{ border: "1px solid #e8dcc5", borderRadius: 12, padding: 18, background: "#fff" }}><b style={{ color: "#7b1420" }}>Kundali Analysis</b><p style={{ margin: "8px 0 0", color: "#66585b", lineHeight: 1.6, fontSize: 14 }}>Personal analysis of your birth chart and planetary placements.</p></div>
          <div style={{ border: "1px solid #e8dcc5", borderRadius: 12, padding: 18, background: "#fff" }}><b style={{ color: "#7b1420" }}>Gemstone Consultation</b><p style={{ margin: "8px 0 0", color: "#66585b", lineHeight: 1.6, fontSize: 14 }}>Discuss gemstone suitability and selection based on your consultation.</p></div>
        </div>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600, gridColumn: "1 / -1" }}>Select a service<select required value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} style={field}><option>Kundali Analysis</option><option>Gemstone Consultation</option><option>Kundali Matching</option></select></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Full name<input required autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Mobile number<input required type="tel" inputMode="tel" autoComplete="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Email address<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Address<input required autoComplete="street-address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600, gridColumn: "1 / -1" }}>Additional details (optional)<textarea rows={3} value={form.concern} onChange={e => setForm({ ...form, concern: e.target.value })} style={{ ...field, resize: "vertical" }} /></label>
          <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 12, lineHeight: 1.6, color: "#75676a" }}>After submitting, WhatsApp will open with your enquiry details for you to review and send to the Shree Gauri team.</p>
          <button type="submit" style={{ gridColumn: "1 / -1", border: 0, borderRadius: 999, padding: "15px 22px", background: "#7b1420", color: "#fff", fontWeight: 700, letterSpacing: ".05em", cursor: "pointer" }}>SEND ENQUIRY</button>
        </form>
        <p style={{ textAlign: "center", margin: "22px 0 0", fontSize: 13 }}><a href="/" style={{ color: "#7b1420" }}>← Back to Shree Gauri</a></p>
      </section>
    </main>
  );
}

const field: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d9cbb5",
  borderRadius: 10,
  padding: "12px 13px",
  background: "#fff",
  color: "#35252a",
  font: "inherit",
};
