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
      `Area of guidance: ${form.concern || "Not specified"}`,
    ].join("\n");
    window.location.href = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  return (
    <main style={{ minHeight: "75vh", background: "#fbf7ef", padding: "clamp(24px, 5vw, 64px) 18px", color: "#35252a" }}>
      <section style={{ maxWidth: 760, margin: "0 auto", background: "#fffdf8", border: "1px solid #e8dcc5", borderRadius: 18, padding: "clamp(22px, 5vw, 46px)", boxShadow: "0 12px 40px rgba(54,35,28,.08)" }}>
        <p style={{ color: "#9b762e", letterSpacing: ".16em", fontSize: 12, fontWeight: 700, margin: 0 }}>SHREE GAURI · PERSONAL GUIDANCE</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px, 5vw, 44px)", margin: "12px 0" }}>Astrology Consultation</h1>
        <p style={{ lineHeight: 1.7, color: "#66585b", marginBottom: 28 }}>Request a personal consultation with Gourav Sharma. Share your contact details and the area you would like guidance on; your message will open in WhatsApp for you to review and send.</p>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Full name<input required autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Mobile number<input required type="tel" inputMode="tel" autoComplete="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Email address<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600 }}>Address<input required autoComplete="street-address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={field} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 14, fontWeight: 600, gridColumn: "1 / -1" }}>What would you like guidance on? (optional)<textarea rows={3} value={form.concern} onChange={e => setForm({ ...form, concern: e.target.value })} style={{ ...field, resize: "vertical" }} /></label>
          <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 12, lineHeight: 1.6, color: "#75676a" }}>Your details are included in the WhatsApp message only when you choose to send it. Please share only information you are comfortable providing.</p>
          <button type="submit" style={{ gridColumn: "1 / -1", border: 0, borderRadius: 999, padding: "15px 22px", background: "#7b1420", color: "#fff", fontWeight: 700, letterSpacing: ".05em", cursor: "pointer" }}>REQUEST CONSULTATION ON WHATSAPP</button>
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
