import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Shop Spiritual Products & Collections Online | Shree Gauri",
  description: "Explore Shree Gauri product collections, including bracelets, gemstones, spiritual essentials, idols and other available categories. Browse product details and shop online.",
  alternates: { canonical: "https://shreegauri.in/collections" },
  openGraph: { title: "Shop Product Collections | Shree Gauri", description: "Browse Shree Gauri's active product categories and collections.", url: "https://shreegauri.in/collections", type: "website" },
};

async function getCategories() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await db.from("categories").select("id,name,slug,description,image_url,parent_id,sort_order,collection_type").eq("is_active", true).eq("collection_type", "category").order("sort_order");
  return data || [];
}

export default async function CollectionsPage() {
  const categories = await getCategories();
  const roots = categories.filter((c: any) => !c.parent_id);
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Shree Gauri Product Collections", url: "https://shreegauri.in/collections", mainEntity: { "@type": "ItemList", itemListElement: roots.map((c: any, i: number) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: "https://shreegauri.in/collections/" + c.slug })) } };
  return <main style={{ background: "#fffdf8", color: "#302321", minHeight: "100vh" }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header style={{ padding: "18px clamp(18px,5vw,72px)", borderBottom: "1px solid #eadfce", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <Link href="/" style={{ fontFamily: "Georgia,serif", fontWeight: 700, letterSpacing: ".12em", color: "#741923", textDecoration: "none" }}>SHREE GAURI</Link>
      <nav style={{ display: "flex", gap: 18, fontSize: 14 }}><Link href="/" style={{ color: "#493936" }}>Home</Link><Link href="/gemstones" style={{ color: "#493936" }}>Gemstones</Link><Link href="/contact" style={{ color: "#493936" }}>Contact</Link></nav>
    </header>
    <section style={{ padding: "clamp(42px,7vw,82px) 20px 48px", textAlign: "center", background: "linear-gradient(135deg,#fff9ed,#f5ead8)" }}>
      <p style={{ color: "#8a641e", letterSpacing: ".2em", fontSize: 12, fontWeight: 700 }}>THE SHREE GAURI COLLECTIONS</p>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(34px,6vw,58px)", lineHeight: 1.08, maxWidth: 900, margin: "16px auto", color: "#3c171b" }}>Explore Our Product Collections</h1>
      <p style={{ maxWidth: 740, margin: "0 auto", lineHeight: 1.8, fontSize: 17, color: "#5d4a42" }}>Browse the collections currently available at Shree Gauri. Open a category to see its products, descriptions, images, prices and availability.</p>
    </section>
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 20px 72px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 18 }}>
        {roots.map((c: any) => <Link key={c.id} href={"/collections/" + c.slug} style={{ border: "1px solid #e8ddcc", borderRadius: 10, background: "#fff", overflow: "hidden", textDecoration: "none", color: "#382b27" }}>
          {c.image_url ? <img src={c.image_url} alt={c.name} loading="lazy" style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} /> : <div style={{ aspectRatio: "16/6", background: "#f7f0e5", display: "grid", placeItems: "center", color: "#99743b", fontSize: 28 }}>✦</div>}
          <div style={{ padding: 20 }}><h2 style={{ fontFamily: "Georgia,serif", fontSize: 23, color: "#741923", margin: "0 0 8px" }}>{c.name}</h2><p style={{ color: "#6a5a52", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{c.description || "Explore available " + c.name.toLowerCase() + " products from Shree Gauri."}</p><span style={{ display: "inline-block", marginTop: 14, fontSize: 13, fontWeight: 700, color: "#741923" }}>EXPLORE COLLECTION →</span></div>
        </Link>)}
      </div>
      {!roots.length && <p style={{ textAlign: "center", color: "#6a5a52" }}>Our collections are being updated. Please visit the store to browse available products.</p>}
      <p style={{ textAlign: "center", marginTop: 34 }}><Link href="/gemstones" style={{ color: "#741923", fontWeight: 700 }}>Explore dedicated gemstone guides</Link></p>
    </section>
    <footer style={{ padding: 26, textAlign: "center", borderTop: "1px solid #eadfce", color: "#6a5a52", fontSize: 13 }}>© {new Date().getFullYear()} Shree Gauri · <Link href="/" style={{ color: "#741923" }}>Visit Store</Link></footer>
  </main>;
}
