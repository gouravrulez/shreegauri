import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const PRIMARY_ADMIN="42dcd32a-2ec6-406c-8be3-703237a33d0d";
Deno.serve(async(req:Request)=>{
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  const authHeader=req.headers.get("Authorization")||"",token=authHeader.startsWith("Bearer ")?authHeader.slice(7).trim():"";
  if(!token)return json({error:"Sign in required."},401);
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!service)throw new Error("Admin service is not configured.");
  const authClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:{user},error:authError}=await authClient.auth.getUser(token);
  if(authError||!user)return json({error:"Session expired. Sign in again."},401);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:staff,error:staffError}=await db.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
  if(staffError)throw staffError;
  const role=String(staff?.role||"");
  if(!["admin","manager","support"].includes(role))return json({error:"You do not have access to astrology enquiries."},403);
  const body=await req.json().catch(()=>({}));
  if(body.action==="list"){
   const [{data:enquiries,error},{data:settings,error:settingsError}]=await Promise.all([db.from("astrology_enquiries").select("*").order("created_at",{ascending:false}).limit(500),db.from("site_settings").select("astrology_services").eq("id",1).single()]);
   if(error)throw error;if(settingsError)throw settingsError;
   return json({ok:true,enquiries:enquiries||[],services:Array.isArray(settings?.astrology_services)?settings.astrology_services:[]});
  }
  if(body.action==="update_status"){
   const id=String(body.id||""),status=String(body.status||"");
   if(!id||!["new","contacted","in_progress","completed","closed"].includes(status))return json({error:"Invalid enquiry update."},400);
   const {error}=await db.from("astrology_enquiries").update({status,updated_at:new Date().toISOString()}).eq("id",id);
   if(error)throw error;return json({ok:true,message:"Enquiry status updated."});
  }
  if(body.action==="save_services"){
   if(role!=="admin"||user.id!==PRIMARY_ADMIN)return json({error:"Only the primary administrator can edit consultation services."},403);
   const services=Array.isArray(body.services)?body.services:[];
   if(services.length>20)return json({error:"You can add up to 20 consultation services."},400);
   const clean=services.map((s:any)=>({name:String(s.name||"").trim().slice(0,100),description:String(s.description||"").trim().slice(0,500),active:s.active!==false})).filter((s:any)=>s.name.length>=2);
   if(!clean.some((s:any)=>s.active))return json({error:"Keep at least one consultation service visible on the website."},400);
   const {error}=await db.from("site_settings").update({astrology_services:clean,updated_at:new Date().toISOString()}).eq("id",1);
   if(error)throw error;return json({ok:true,services:clean,message:"Consultation services saved."});
  }
  return json({error:"Unknown astrology action."},400);
 }catch(e){console.error("astrology-admin:",e);return json({error:"Astrology admin request failed."},500);}
});