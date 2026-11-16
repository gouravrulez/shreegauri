import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowed = new Set(["pending","confirmed","processing","packed","shipped","out_for_delivery","delivered","cancelled"]);
const mailStatuses = new Set(["confirmed","processing","packed","shipped","out_for_delivery","delivered"]);

Deno.serve(async (req: Request) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json" } });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({error:"Admin login required."},401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(url, anon, { global:{headers:{Authorization:authHeader}} });
    const {data:{user},error:authError}=await authClient.auth.getUser();
    if(authError||!user) return json({error:"Admin session expired."},401);
    const db=createClient(url,service);
    const {data:staff}=await db.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
    if(!staff || !["admin","manager","orders"].includes(String(staff.role))) return json({error:"Not authorized for order management."},403);
    const body=await req.json(); const id=String(body?.order_id||""); const status=String(body?.order_status||"").toLowerCase(); const trackingUpdate=body?.tracking_update===true;
    if(!id||!allowed.has(status)) return json({error:"Invalid order update."},400);
    const {data:order,error:oe}=await db.from("orders").select("id,order_number,customer_name,email,order_status,courier_name,tracking_number,tracking_url,dispatch_date,expected_delivery_date").eq("id",id).single();
    if(oe||!order) return json({error:"Order not found."},404);
    if(order.order_status!==status){const {error:ue}=await db.from("orders").update({order_status:status,updated_at:new Date().toISOString()}).eq("id",id);if(ue) throw ue;}
    if(!mailStatuses.has(status)||(!trackingUpdate && order.order_status===status)||!order.email) return json({ok:true,email_sent:false});
    const key=Deno.env.get("RESEND_API_KEY");
    if(!key) return json({ok:true,email_sent:false,warning:"Email service is not configured."});
    const copy:Record<string,[string,string]>={confirmed:["Order confirmed","We have confirmed your order and will begin preparing it shortly."],processing:["Order processing","Your order is now being prepared by our team."],packed:["Order packed","Your order has been packed and is ready for dispatch."],shipped:["Order shipped","Your order has been shipped and is on its way."],out_for_delivery:["Out for delivery","Your order is with the delivery partner and is expected shortly."],delivered:["Order delivered","Your order has been marked as delivered. We hope you love your purchase."]};
    const [heading,message]=copy[status];
    const trackingHtml=trackingUpdate?`<hr/><h3>Shipment details</h3><p>Courier: ${order.courier_name||"To be confirmed"}</p><p>AWB / Tracking number: ${order.tracking_number||"Not yet assigned"}</p>${order.dispatch_date?`<p>Dispatch date: ${order.dispatch_date}</p>`:""}${order.expected_delivery_date?`<p>Expected delivery: ${order.expected_delivery_date}</p>`:""}${order.tracking_url?`<p><a href="${order.tracking_url}">Track your shipment</a></p>`:""}`:"";
    const from=Deno.env.get("ORDER_EMAIL_FROM")||"Shree Gauri <orders@shreegauri.in>";
    const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[order.email],subject:`${heading} — ${order.order_number}`,html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#3b171d"><h1>${heading}</h1><p>Namaste ${order.customer_name||"Customer"},</p><p>${message}</p><p>Order: <strong>${order.order_number}</strong></p>${trackingHtml}<p>Thank you for choosing Shree Gauri.</p></div>`})});
    if(!res.ok){console.error("Resend:",await res.text()); return json({ok:true,email_sent:false,warning:"Order updated but email could not be sent."});}
    return json({ok:true,email_sent:true});
  } catch(e){ console.error(e); return json({error:"Unable to update order status."},500); }
});