import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://shreegauri.in";
  const gemstoneSlugs = ["blue-sapphire","yellow-sapphire","emerald","ruby","red-coral","pearl","hessonite","cats-eye","amethyst","rose-quartz","citrine","tiger-eye","pyrite","seven-chakra"];
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: base + "/gemstones", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: base + "/collections", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: base + "/bracelets", lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    ...gemstoneSlugs.map((slug) => ({ url: base + "/gemstones/" + slug, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: base + "/astrology", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
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
    .eq("brand", "Shree Gauri")
    .eq("is_active", true);

  const { data: categoryProducts } = await supabase
    .from("products")
    .select("category_id")
    .eq("brand", "Shree Gauri")
    .eq("is_active", true)
    .not("category_id", "is", null);

  const categoryIds = [...new Set((categoryProducts || []).map((p: any) => p.category_id).filter(Boolean))];
  const { data: categoryData } = categoryIds.length
    ? await supabase.from("categories").select("id,slug").in("id", categoryIds).eq("collection_type", "category").eq("is_active", true)
    : { data: [] as any[] };

  const categoryPages: MetadataRoute.Sitemap = (categoryData || []).map((c: any) => ({
    url: `${base}/collections/${encodeURIComponent(c.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const products: MetadataRoute.Sitemap = (data || []).map((p: any) => ({
    url: `${base}/product/${encodeURIComponent(p.slug || p.id)}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...pages, ...categoryPages, ...products];
}
