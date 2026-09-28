import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";
const allowed = new Set(["pending","confirmed","processing","shipped","delivered","cancelled"]);
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
export async function POST(request:Request){
 try{
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)return NextResponse.json({error:"Admin service is not configured."},{status:503});
  const db=createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const h=request.headers.get("authorization")||""; const token=h.startsWith("Bearer ")?h.slice(7).trim():"";
  if(!token)return NextResponse.json({error:"Admin login required."},{status:401});
  const {data:auth,error:authError}=await db.auth.getUser(token);
  if(authError||!auth.user)return NextResponse.json({error:"Admin session expired."},{status:401});
  const {data:admin}=await db.from("admin_users").select("user_id").eq("user_id",auth.user.id).eq("role","admin").maybeSingle();
  if(!admin)return NextResponse.json({error:"This account is not authorized for administration."},{status:403});
  const body=await request.json(); const id=String(body?.order_id||""); const status=String(body?.order_status||"").toLowerCase();
  if(!id||!allowed.has(status))return NextResponse.json({error:"Invalid order update."},{status:400});
  const {data:order,error:oe}=await db.from("orders").select("id,order_number,customer_name,email,order_status").eq("id",id).single();
  if(oe||!order)return NextResponse.json({error:"Order not found."},{status:404});
  const {error:ue}=await db.from("orders").update({order_status:status,updated_at:new Date().toISOString()}).eq("id",id); if(ue)throw ue;
  let emailSent=false;
  if(status==="shipped"&&order.order_status!=="shipped"&&order.email){
   const rk=process.env.RESEND_API_KEY;
   if(!rk)return NextResponse.json({ok:true,email_sent:false,warning:"Order updated, but email service is not configured."});
   const from=process.env.ORDER_EMAIL_FROM||"Shree Gauri <orders@shreegauri.in>";
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${rk}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[order.email],subject:`Your Shree Gauri order ${order.order_number} has been shipped`,html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#3b171d"><h1 style="color:#6b2334">Your order has been shipped</h1><p>Namaste ${esc(order.customer_name||"Customer")},</p><p>Your Shree Gauri order <strong>${esc(order.order_number)}</strong> has been shipped and is on its way.</p><p>You can check the latest status from your Shree Gauri customer account.</p><p style="margin-top:28px">Thank you for choosing Shree Gauri.</p><p><strong>Shree Gauri</strong><br>www.shreegauri.in</p></div>`})});
   emailSent=res.ok; if(!res.ok)console.error("Shipped email failed:",await res.text());
  }
  return NextResponse.json({ok:true,email_sent:emailSent});
 }catch(e){console.error("Admin order status error:",e);return NextResponse.json({error:"Unable to update order status."},{status:500});}
}
