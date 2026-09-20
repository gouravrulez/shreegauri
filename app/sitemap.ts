import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://shreegauri.in";
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: base + "/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: base + "/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: base + "/terms", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: base + "/shipping-returns", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return pages;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("products")
    .select("id,slug,created_at")
    .eq("is_active", true);

  const products: MetadataRoute.Sitemap = (data || []).map((p: any) => ({
    url: `${base}/?product=${encodeURIComponent(p.slug || p.id)}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...pages, ...products];
}
