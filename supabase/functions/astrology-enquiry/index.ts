import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
Deno.serve(async (req: Request) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type":"application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error:"Method not allowed." },405);
  try {
    const body = await req.json();
    if (String(body?.website || "").trim()) return json({ ok:true });
    const full_name=String(body?.full_name||"").trim(), mobile=String(body?.mobile||"").trim(), email=String(body?.email||"").trim().toLowerCase(), address=String(body?.address||"").trim(), service=String(body?.service||"").trim(), preferred_time=String(body?.preferred_time||"").trim().slice(0,160), details=String(body?.details||"").trim().slice(0,2000);
    if(full_name.length<2||full_name.length>120||mobile.length<7||mobile.length>25||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||address.length<5||address.length>500||service.length<2||service.length>120) return json({error:"Please check your name, mobile, email, address and consultation type."},400);
    const url=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!key) throw new Error("Database service is not configured.");
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await db.from("astrology_enquiries").insert({full_name,mobile,email,address,service,preferred_time:preferred_time||null,details:details||null}).select("id").single();
    if(error) throw error;
    const resendKey=Deno.env.get("RESEND_API_KEY");
    if(!resendKey){await db.from("astrology_enquiries").update({email_status:"not_configured"}).eq("id",data.id);return json({ok:true,email_sent:false,message:"Your enquiry has been received. Our team will contact you."});}
    const from=Deno.env.get("ORDER_EMAIL_FROM")||"Shree Gauri <orders@shreegauri.in>";
    const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
    const html=`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#35252a"><h2>New Astrology Consultation Enquiry</h2><p><b>Name:</b> ${esc(full_name)}</p><p><b>Mobile:</b> ${esc(mobile)}</p><p><b>Email:</b> ${esc(email)}</p><p><b>Address:</b> ${esc(address)}</p><p><b>Consultation:</b> ${esc(service)}</p><p><b>Preferred time:</b> ${esc(preferred_time||"Flexible")}</p><p><b>Details:</b><br>${esc(details||"Not provided")}</p><p>Enquiry ID: ${esc(data.id)}</p></div>`;
    const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:["gauritechnologiespvt@gmail.com"],reply_to:email,subject:`New astrology enquiry — ${full_name}`,html})});
    if(!mail.ok){const reason=(await mail.text()).slice(0,500);await db.from("astrology_enquiries").update({email_status:"failed",email_error:reason}).eq("id",data.id);return json({ok:true,email_sent:false,message:"Your enquiry has been received. Our team will contact you."});}
    await db.from("astrology_enquiries").update({email_status:"sent"}).eq("id",data.id);
    return json({ok:true,email_sent:true,message:"Your enquiry has been received. Our team will contact you."});
  }catch(e){console.error("astrology-enquiry:",e);return json({error:"We could not submit your enquiry just now. Please try again shortly."},500);}
});