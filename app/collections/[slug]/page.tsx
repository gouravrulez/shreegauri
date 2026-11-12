import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 1800;
type Category = { id: string; name: string; slug: string; description: string | null; image_url: string | null; parent_id: string | null };
type Product = { id: string; name: string; slug: string | null; short_description: string | null; description: string | null; price_inr: number; primary_image_url: string | null; stock_quantity: number | null; category_id: string | null };
function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}
async function getCategory(slug: string) {
  const db = dbClient(); if (!db) return null;
  const { data } = await db.from("categories").select("id,name,slug,description,image_url,parent_id").eq("slug", slug).eq("is_active", true).eq("collection_type", "category").maybeSingle();
  return data as Category | null;
}
async function getCollection(slug: string) {
  const db = dbClient(); if (!db) return { category: null, children: [], products: [] as Product[] };
  const category = await getCategory(slug); if (!category) return { category: null, children: [], products: [] as Product[] };
  const { data: children } = await db.from("categories").select("id,name,slug,description,image_url,parent_id").eq("parent_id", category.id).eq("is_active", true).eq("collection_type", "category").order("sort_order");
  const ids = [category.id, ...((children || []) as Category[]).map(c => c.id)];
  const { data: products } = await db.from("products").select("id,name,slug,short_description,description,price_inr,primary_image_url,stock_quantity,category_id").eq("brand", "Shree Gauri").eq("is_active", true).in("category_id", ids).order("created_at", { ascending: false }).limit(100);
  return { category, children: (children || []) as Category[], products: (products || []) as Product[] };
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params, { category, products } = await getCollection(slug); if (!category) return {};
  const desc = (category.description || "Explore " + category.name + " at Shree Gauri. Browse available products, images, prices and product details online.").replace(/\s+/g, " ").slice(0, 155);
  return { title: category.name + " Online in India | Products & Prices | Shree Gauri", description: desc, alternates: { canonical: "https://shreegauri.in/collections/" + category.slug }, robots: { index: products.length > 0, follow: true }, openGraph: { title: category.name + " | Shree Gauri", description: desc, url: "https://shreegauri.in/collections/" + category.slug, images: category.image_url ? [category.image_url] : [], type: "website" } };
}
export default async function CategoryCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, { category, children, products } = await getCollection(slug);
  if (!category) notFound();
  const title = category.name + " Online at Shree Gauri";
  const intro = category.description || "Explore the Shree Gauri " + category.name.toLowerCase() + " collection. Compare product photographs, descriptions, prices, materials and availability to choose the item that suits your requirements.";
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: "https://shreegauri.in/collections/" + category.slug, description: intro, mainEntity: { "@type": "ItemList", itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: "https://shreegauri.in/product/" + encodeURIComponent(p.slug || p.id) })) } };
  return <main style={{ background: "#fffdf8", color: "#302321", minHeight: "100vh" }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header style={{ padding: "18px clamp(18px,5vw,72px)", borderBottom: "1px solid #eadfce", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><Link href="/" style={{ fontFamily: "Georgia,serif", fontWeight: 700, letterSpacing: ".12em", color: "#741923", textDecoration: "none" }}>SHREE GAURI</Link><nav style={{ display: "flex", gap: 18, fontSize: 14 }}><Link href="/" style={{ color: "#493936" }}>Home</Link><Link href="/collections" style={{ color: "#493936" }}>All Collections</Link><Link href="/gemstones" style={{ color: "#493936" }}>Gemstones</Link></nav></header>
    <nav aria-label="Breadcrumb" style={{ maxWidth: 1180, margin: "18px auto", padding: "0 20px", fontSize: 13, color: "#796a61" }}><Link href="/" style={{ color: "#741923" }}>Home</Link> / <Link href="/collections" style={{ color: "#741923" }}>Collections</Link> / {category.name}</nav>
    <section style={{ padding: "clamp(40px,7vw,76px) 20px 46px", textAlign: "center", background: "linear-gradient(135deg,#fff9ed,#f5ead8)" }}>
      <p style={{ color: "#8a641e", letterSpacing: ".2em", fontSize: 12, fontWeight: 700 }}>SHREE GAURI COLLECTION</p>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(34px,6vw,56px)", lineHeight: 1.1, maxWidth: 900, margin: "16px auto", color: "#3c171b" }}>{title}</h1>
      <p style={{ maxWidth: 780, margin: "0 auto", lineHeight: 1.85, fontSize: 16, color: "#5d4a42" }}>{intro}</p>
    </section>
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 20px 72px" }}>
      {children.length > 0 && <><h2 style={{ fontFamily: "Georgia,serif", fontSize: 27, color: "#3c171b" }}>Explore {category.name} types</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "16px 0 30px" }}>{children.map(c => <Link key={c.id} href={"/collections/" + c.slug} style={{ border: "1px solid #e8ddcc", borderRadius: 30, padding: "9px 15px", color: "#741923", background: "#fff", textDecoration: "none", fontSize: 14 }}>{c.name}</Link>)}</div></>}
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 30, textAlign: "center", color: "#3c171b" }}>Available {category.name}</h2>
      <p style={{ textAlign: "center", color: "#6a5a52", margin: "9px 0 28px" }}>Product details, current prices and availability are shown on each listing.</p>
      {products.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 18 }}>
        {products.map(p => <article key={p.id} style={{ border: "1px solid #e8ddcc", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
          <Link href={"/product/" + encodeURIComponent(p.slug || p.id)} style={{ color: "inherit", textDecoration: "none" }}>
            {p.primary_image_url ? <img src={p.primary_image_url} alt={p.name} loading="lazy" style={{ width: "100%", aspectRatio: "1/1", objectFit: "contain", background: "#f8f4ed", display: "block" }} /> : <div style={{ aspectRatio: "1/1", background: "#f8f4ed", display: "grid", placeItems: "center", color: "#99743b" }}>SHREE GAURI</div>}
            <div style={{ padding: 15 }}><h3 style={{ color: "#741923", fontFamily: "Georgia,serif", fontSize: 19, margin: "0 0 7px" }}>{p.name}</h3>{p.short_description && <p style={{ fontSize: 13, lineHeight: 1.6, color: "#6a5a52", margin: "0 0 10px" }}>{p.short_description}</p>}<strong style={{ fontSize: 18 }}>₹{Number(p.price_inr).toLocaleString("en-IN")}</strong><p style={{ fontSize: 12, color: Number(p.stock_quantity || 0) > 0 ? "#287344" : "#9a4b35", margin: "8px 0 0" }}>{Number(p.stock_quantity || 0) > 0 ? "In stock" : "Currently unavailable"}</p></div>
          </Link>
        </article>)}
      </div> : <p style={{ textAlign: "center", padding: 28, color: "#6a5a52", border: "1px solid #e8ddcc", borderRadius: 10 }}>There are no active products in this collection at the moment. Please check back soon or browse all products in the store.</p>}
      <div style={{ textAlign: "center", marginTop: 34 }}><Link href="/?view=shop" style={{ display: "inline-block", padding: "13px 24px", background: "#741923", color: "#fff", borderRadius: 5, textDecoration: "none", fontWeight: 700 }}>SHOP ALL PRODUCTS</Link></div>
    </section>
    <footer style={{ padding: 26, textAlign: "center", borderTop: "1px solid #eadfce", color: "#6a5a52", fontSize: 13 }}>© {new Date().getFullYear()} Shree Gauri · <Link href="/collections" style={{ color: "#741923" }}>All Collections</Link></footer>
  </main>;
}
