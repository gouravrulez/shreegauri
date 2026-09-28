import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://hhtqnpxarrbagyvswqrj.supabase.co";
const allowed = new Set(["pending","confirmed","processing","packed","shipped","delivered","cancelled"]);
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
  const emailStatus = ["confirmed","processing","packed","shipped","delivered"].includes(status);
  if(emailStatus&&order.order_status!==status&&order.email){
   const rk=process.env.RESEND_API_KEY;
   if(!rk)return NextResponse.json({ok:true,email_sent:false,warning:"Order updated, but email service is not configured."});
   const from=process.env.ORDER_EMAIL_FROM||"Shree Gauri <orders@shreegauri.in>";
   const copy:Record<string,{subject:string;heading:string;message:string}> = {
    confirmed:{subject:`Your Shree Gauri order ${order.order_number} is confirmed`,heading:"Order confirmed",message:"We have confirmed your order and will begin preparing it shortly."},
    processing:{subject:`Your Shree Gauri order ${order.order_number} is being prepared`,heading:"We are preparing your order",message:"Your order is now being prepared by our team."},
    packed:{subject:`Your Shree Gauri order ${order.order_number} is packed`,heading:"Your order is packed",message:"Your order has been packed and is ready for dispatch."},
    shipped:{subject:`Your Shree Gauri order ${order.order_number} has been shipped`,heading:"Your order has been shipped",message:"Your order has been shipped and is on its way."},
    delivered:{subject:`Your Shree Gauri order ${order.order_number} has been delivered`,heading:"Your order has been delivered",message:"Your order has been marked as delivered. We hope you love your purchase."}
   };
   const m=copy[status];
   if(!m)return NextResponse.json({ok:true,email_sent:false});
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${rk}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[order.email],subject:m.subject,html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#3b171d"><h1 style="color:#6b2334">${m.heading}</h1><p>Namaste ${esc(order.customer_name||"Customer")},</p><p>${m.message}</p><p>Order: <strong>${esc(order.order_number)}</strong></p><p>You can check the latest status from your Shree Gauri customer account.</p><p style="margin-top:28px">Thank you for choosing Shree Gauri.</p><p><strong>Shree Gauri</strong><br>www.shreegauri.in</p></div>`})});
   emailSent=res.ok; if(!res.ok)console.error("Order status email failed:",await res.text());
  }
  return NextResponse.json({ok:true,email_sent:emailSent});
 }catch(e){console.error("Admin order status error:",e);return NextResponse.json({error:"Unable to update order status."},{status:500});}
}
