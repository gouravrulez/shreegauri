import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Gemstone Bracelets Online in India | Shree Gauri",
  description: "Explore gemstone bracelets at Shree Gauri. Browse available natural stone bracelets, product photographs, prices and details, with online ordering across India.",
  alternates: { canonical: "https://shreegauri.in/bracelets" },
  openGraph: { title: "Gemstone Bracelets Online | Shree Gauri", description: "Browse gemstone bracelets, product photographs, prices and details at Shree Gauri.", url: "https://shreegauri.in/bracelets", type: "website" },
};

type Product = { id: string; name: string; slug: string | null; short_description: string | null; description: string | null; price_inr: number; primary_image_url: string | null; stock_quantity: number | null };
async function getBracelets() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [] as Product[];
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: category } = await db.from("categories").select("id").eq("slug", "gemstone-bracelets").eq("collection_type", "category").eq("is_active", true).maybeSingle();
  if (!category) return [] as Product[];
  const { data } = await db.from("products").select("id,name,slug,short_description,description,price_inr,primary_image_url,stock_quantity").eq("brand", "Shree Gauri").eq("is_active", true).eq("category_id", category.id).order("created_at", { ascending: false }).limit(100);
  return (data || []) as Product[];
}

export default async function BraceletsPage() {
  const products = await getBracelets();
  const url = "https://shreegauri.in/bracelets";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Gemstone Bracelets Online at Shree Gauri",
    description: "Browse gemstone bracelets available from Shree Gauri, with product details, prices and photographs.",
    url,
    mainEntity: { "@type": "ItemList", itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: "https://shreegauri.in/product/" + encodeURIComponent(p.slug || p.id) })) }
  };
  return <main style={{ background: "#fffdf8", color: "#302321", minHeight: "100vh" }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header style={{ padding: "18px clamp(18px,5vw,72px)", borderBottom: "1px solid #eadfce", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <Link href="/" style={{ fontFamily: "Georgia,serif", fontWeight: 700, letterSpacing: ".12em", color: "#741923", textDecoration: "none" }}>SHREE GAURI</Link>
      <nav style={{ display: "flex", gap: 18, fontSize: 14 }}><Link href="/" style={{ color: "#493936" }}>Home</Link><Link href="/gemstones" style={{ color: "#493936" }}>Gemstones</Link><Link href="/collections" style={{ color: "#493936" }}>All Collections</Link></nav>
    </header>
    <nav aria-label="Breadcrumb" style={{ maxWidth: 1180, margin: "18px auto", padding: "0 20px", fontSize: 13, color: "#796a61" }}><Link href="/" style={{ color: "#741923" }}>Home</Link> / Gemstone Bracelets</nav>
    <section style={{ padding: "clamp(42px,7vw,78px) 20px 48px", textAlign: "center", background: "linear-gradient(135deg,#fff9ed,#f5ead8)" }}>
      <p style={{ color: "#8a641e", letterSpacing: ".2em", fontSize: 12, fontWeight: 700 }}>SHREE GAURI · GEMSTONE JEWELLERY</p>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(34px,6vw,58px)", lineHeight: 1.08, maxWidth: 900, margin: "16px auto", color: "#3c171b" }}>Gemstone Bracelets Online</h1>
      <p style={{ maxWidth: 780, margin: "0 auto", lineHeight: 1.85, fontSize: 17, color: "#5d4a42" }}>Explore gemstone bracelets selected for their natural colours, distinctive patterns and everyday style. Browse available designs, compare product photographs and prices, and read the details for each bracelet before ordering online from Shree Gauri.</p>
    </section>
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 20px 24px" }}>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 30, color: "#3c171b", textAlign: "center" }}>Shop Available Gemstone Bracelets</h2>
      <p style={{ textAlign: "center", color: "#6a5a52", margin: "9px 0 28px" }}>Current product listings, prices and availability are loaded from the Shree Gauri catalogue.</p>
      {products.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 18 }}>
        {products.map(p => <article key={p.id} style={{ border: "1px solid #e8ddcc", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
          <Link href={"/product/" + encodeURIComponent(p.slug || p.id)} style={{ color: "inherit", textDecoration: "none" }}>
            {p.primary_image_url ? <img src={p.primary_image_url} alt={p.name} loading="lazy" style={{ width: "100%", aspectRatio: "1/1", objectFit: "contain", background: "#f8f4ed", display: "block" }} /> : <div style={{ aspectRatio: "1/1", background: "#f8f4ed", display: "grid", placeItems: "center", color: "#99743b" }}>SHREE GAURI</div>}
            <div style={{ padding: 15 }}><h3 style={{ color: "#741923", fontFamily: "Georgia,serif", fontSize: 19, margin: "0 0 7px" }}>{p.name}</h3>{p.short_description && <p style={{ fontSize: 13, lineHeight: 1.6, color: "#6a5a52", margin: "0 0 10px" }}>{p.short_description.replace(/\*\*/g, "").slice(0, 150)}</p>}<strong style={{ fontSize: 18 }}>₹{Number(p.price_inr).toLocaleString("en-IN")}</strong><p style={{ fontSize: 12, color: Number(p.stock_quantity || 0) > 0 ? "#287344" : "#9a4b35", margin: "8px 0 0" }}>{Number(p.stock_quantity || 0) > 0 ? "In stock" : "Currently unavailable"}</p></div>
          </Link>
        </article>)}
      </div> : <p style={{ textAlign: "center", padding: 28, color: "#6a5a52", border: "1px solid #e8ddcc", borderRadius: 10 }}>Bracelet listings are being updated. Please visit the store to see currently available products.</p>}
    </section>
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 64px", lineHeight: 1.85, color: "#594a44" }}>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 27, color: "#3c171b" }}>Choosing a Gemstone Bracelet</h2>
      <p>When choosing a gemstone bracelet, consider the stone name, bead size, bracelet fit, finish and the product photographs. Natural stones can vary in shade, pattern and inclusions, so the exact appearance may differ slightly from one piece to another. Check each product description for the material and other specifications provided by Shree Gauri.</p>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 27, color: "#3c171b", marginTop: 28 }}>Gemstone Bracelet Care</h2>
      <p>Keep gemstone jewellery away from harsh chemicals, perfumes and prolonged moisture unless the product care instructions say otherwise. Store bracelets separately to reduce scratches, and follow the care notes listed on the individual product page.</p>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 27, color: "#3c171b", marginTop: 28 }}>Traditional Gemstone Associations</h2>
      <p>Some people choose gemstones for their traditional cultural or spiritual symbolism, while others enjoy their natural appearance as jewellery. Such traditional associations are matters of personal belief and are not guarantees of health, financial or other outcomes.</p>
      <p style={{ marginTop: 28 }}><Link href="/collections/gemstone-bracelets" style={{ color: "#741923", fontWeight: 700 }}>View the full Gemstone Bracelets collection</Link> · <Link href="/gemstones" style={{ color: "#741923", fontWeight: 700 }}>Explore gemstone guides</Link></p>
    </section>
    <footer style={{ padding: 26, textAlign: "center", borderTop: "1px solid #eadfce", color: "#6a5a52", fontSize: 13 }}>© {new Date().getFullYear()} Shree Gauri · <Link href="/" style={{ color: "#741923" }}>Visit Store</Link></footer>
  </main>;
}
