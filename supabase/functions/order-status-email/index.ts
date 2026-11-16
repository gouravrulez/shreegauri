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
    const body=await req.json(); const id=String(body?.order_id||""); const status=String(body?.or¶»§q«^