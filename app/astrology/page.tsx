"use client";

import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type Service = { name: string; description: string; active: boolean };
const defaults: Service[] = [
  { name: "Kundali Analysis", description: "Detailed interpretation of your birth chart, planetary placements and key life areas.", active: true },
  { name: "Gemstone Consultation", description: "Personalised gemstone recommendations based on your birth chart.", active: true },
];

export default function AstrologyConsultationPage() {
  const [services, setServices] = useState<Service[]>(defaults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    supabase.from("site_settings").select("astrology_services").eq("id", 1).single().then(({data}) => {
      if (Array.isArray((data as any)?.astrology_services)) setServices((data as any).astrology_services);
    });
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setMessage("Submitting your enquiry…");
    const response = await fetch("/api/astrology/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      full_name: String(f.get("name") || ""),
      mobile: String(f.get("mobile") || ""),
      email: String(f.get("email") || ""),
      address: String(f.get("address") || ""),
      service: String(f.get("service") || ""),
      details: String(f.get("concern") || ""),
      website: String(f.get("website") || ""),
    }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data?.ok) { setMessage(data?.error || "Unable to submit right now. Please try again."); return; }
    setMessage(data.message || "Your enquiry has been received. Our team will contact you.");
    form.reset();
  }
  return (
    <main style={{ minHeight:"75vh", background:"#fbf7ef", padding:"clamp(24px,5vw,64px) 18px", color:"#35252a" }}>
      <section style={{ maxWidth:900, margin:"0 auto", background:"#fffdf8", border:"1px solid #e8dcc5", borderRadius:18, padding:"clamp(22px,5vw,46px)", boxShadow:"0 12px 40px rgba(54,35,28,.08)" }}>
        <p style={{ color:"#7b1420", letterSpacing:".16em", fontSize:12, fontWeight:800, margin:0 }}>SHREE GAURI · ASTROLOGY SERVICES</p>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(30px,5vw,44px)", margin:"12px 0", color:"#401016" }}>Personalized Vedic Astrology Consultation</h1>
        <p style={{ lineHeight:1.7, color:"#403632", marginBottom:24 }}>Professional consultation services. Select the service you need and our team will contact you.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:28}}>
          {services.filter(x=>x.active).map(service=><article key={service.name} style={{border:"1px solid #d8c8a8",borderRadius:12,padding:18,background:"#fff",color:"#35252a"}}><h2 style={{fontFamily:"Georgia,serif",fontSize:22,color:"#401016",margin:"0 0 8px"}}>{service.name}</h2><p style={{margin:0,lineHeight:1.6,color:"#403632"}}>{service.description}</p></article>)}
        </div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:26,color:"#401016",margin:"0 0 18px"}}>Request a consultation</h2>
        <form onSubmit={submit} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
          <label style={label}>Full name<input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" style={field}/></label>
          <label style={label}>Mobile number<input name="mobile" required type="tel" minLength={7} maxLength={25} autoComplete="tel" placeholder="Your contact number" style={field}/></label>
          <label style={label}>Email address<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" style={field}/></label>
          <label style={label}>Full address<textarea name="address" required minLength={5} maxLength={500} rows={2} autoComplete="street-address" placeholder="House / street, city, state, PIN code" style={{...field,resize:"vertical"}}/></label>
          <label style={label}>Consultation type<select name="service" required defaultValue="" style={field}><option value="" disabled>Select a service</option>{services.filter(x=>x.active).map(x=><option key={x.name}>{x.name}</option>)}{services.filter(x=>x.active).length>1&&<option>Both consultations</option>}</select></label>
          <label style={{...label,gridColumn:"1 / -1"}}>Additional details (optional)<textarea name="concern" rows={3} maxLength={2000} placeholder="Briefly share your questions or details" style={{...field,resize:"vertical"}}/></label>
          <label style={{position:"absolute",left:"-10000px"}} aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <button type="submit" disabled={busy} style={{gridColumn:"1 / -1",border:0,borderRadius:999,padding:"15px 22px",background:"#7b1420",color:"#fff",fontWeight:800,letterSpacing:".04em",cursor:busy?"wait":"pointer",opacity:busy?0.7:1}}>{busy?"Submitting…":"SUBMIT ENQUIRY"}</button>
          {message&&<p role="status" aria-live="polite" style={{gridColumn:"1 / -1",margin:0,color:"#403632",fontWeight:600}}>{message}</p>}
          <p style={{gridColumn:"1 / -1",margin:0,fontSize:12,lineHeight:1.6,color:"#75675e"}}>Your enquiry is securely recorded for our team. We will contact you using the details provided.</p>
        </form>
        <p style={{textAlign:"center",margin:"24px 0 0",fontSize:13}}><a href="/" style={{color:"#7b1420"}}>← Back to Shree Gauri</a></p>
      </section>
    </main>
  );
}

const label: CSSProperties = { display:"grid", gap:7, fontSize:14, fontWeight:700, color:"#4a2927" };
const field: CSSProperties = { width:"100%", boxSizing:"border-box", border:"1px solid #d9cbb5", borderRadius:10, padding:"12px 13px", background:"#fff", color:"#35252a", font:"inherit" };
