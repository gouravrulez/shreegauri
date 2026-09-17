import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const esc = (v: unknown) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new NextResponse("Missing storefront configuration", { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("products").select("id,name,slug,short_description,description,price_inr,stock_quantity,primary_image_url,image_urls,google_product_category,brand").eq("is_active", true);
  if (error) return new NextResponse("Unable to build product feed", { status: 500 });
  const origin = "https://www.shreegauri.in";
  const items = (data || []).filter((p:any)=>p.primary_image_url && Number(p.price_inr)>0).map((p:any)=>{
    const extras = Array.isArray(p.image_urls) ? p.image_urls.filter(Boolean).slice(0,10) : [];
    return `<item><g:id>${esc(p.id)}</g:id><title>${esc(p.name)}</title><description>${esc(p.short_description || p.description || p.name)}</description><link>${origin}/?product=${encodeURIComponent(p.slug || p.id)}</link><g:image_link>${esc(p.primary_image_url)}</g:image_link>${extras.map((x:string)=>`<g:additional_image_link>${esc(x)}</g:additional_image_link>`).join("")}<g:availability>${Number(p.stock_quantity)>0?"in_stock":"out_of_stock"}</g:availability><g:price>${Number(p.price_inr).toFixed(2)} INR</g:price><g:condition>new</g:condition><g:brand>${esc(p.brand || "Shree Gauri")}</g:brand><g:identifier_exists>false</g:identifier_exists>${p.google_product_category?`<g:google_product_category>${esc(p.google_product_category)}</g:google_product_category>`:""}</item>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Shree Gauri</title><link>${origin}</link><description>Shree Gauri jewellery and spiritual products</description>${items}</channel></rss>`;
  return new NextResponse(xml, { headers: { "Content-Type":"application/xml; charset=utf-8", "Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400" } });
}
