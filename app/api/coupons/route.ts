import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return NextResponse.json({ coupons: [] });
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const now = new Date().toISOString();
    const { data, error } = await admin.from("promo_codes")
      .select("id,code,discount_type,discount_value,min_order_inr,max_discount_inr,starts_at,ends_at")
      .eq("is_active", true).eq("is_public", true).eq("show_on_dashboard", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const coupons = (data || []).filter((item: any) =>
      (!item.starts_at || item.starts_at <= now) && (!item.ends_at || item.ends_at >= now)
    );
    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ coupons: [] }, { status: 200 });
  }
}
