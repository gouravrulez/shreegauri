"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price_inr: number;
  compare_at_price_inr: number | null;
  primary_image_url: string | null;
  image_urls: string[] | null;
  stock_quantity: number;
  badge: string | null;
  category_id: string | null;
};

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!alive) return;
        if (queryError || !data) {
          setError("This product is not available right now.");
          setLoading(false);
          return;
        }
        const next = { ...data, image_urls: Array.isArray(data.image_urls) ? data.image_urls : [] } as Product;
        setProduct(next);
        setActiveImage(next.primary_image_url || next.image_urls?.[0] || "");
        setLoading(false);
      });
    return () => { alive = false; };
  }, [slug]);

  const images = useMemo(() => product ? Array.from(new Set([product.primary_image_url, ...(product.image_urls || [])].filter(Boolean))) as string[] : [], [product]);
  const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

  function addToCart(buyNow = false) {
    if (!product || typeof window === "undefined") return;
    let current: Product[] = [];
    try { current = JSON.parse(localStorage.getItem("sg_cart") || "[]"); } catch { current = []; }
    const chosen = Array.from({ length: quantity }, () => product);
    localStorage.setItem("sg_cart", JSON.stringify(buyNow ? chosen : [...current, ...chosen]));
    if (buyNow) window.location.href = "/?checkout=1";
    else {
      setAdded(true);
      window.location.href = "/?cart=1";
    }
  }

  if (loading) return <main className="sg-product-page"><div className="sg-product-loading">Loading product details…</div></main>;
  if (error || !product) return <main className="sg-product-page"><div className="sg-product-loading"><h1>Product unavailable</h1><p>{error}</p><a href="/">Return to Shree Gauri</a></div></main>;

  return (
    <main className="sg-product-page">
      <header className="sg-product-header">
        <a href="/" className="sg-product-brand"><span>SG</span><b>SHREE GAURI</b><small>DIVINE ENERGY. TIMELESS BEAUTY.</small></a>
        <a href="/?cart=1" className="sg-product-cart">VIEW CART</a>
      </header>
      <nav className="sg-product-breadcrumb"><a href="/">Home</a><span>/</span><a href="/?shop=1">Shop</a><span>/</span><b>{product.name}</b></nav>
      <section className="sg-product-detail-layout">
        <div className="sg-product-gallery">
          <div className="sg-product-thumbnails">
            {images.map((url, index) => <button key={url} type="button" className={activeImage === url ? "active" : ""} onClick={() => setActiveImage(url)} aria-label={`View image ${index + 1}`}><img src={url} alt="" /></button>)}
          </div>
          <div className="sg-product-image-stage">
            {product.badge && <span className="sg-product-badge">{product.badge}</span>}
            <img src={activeImage || "/shree-gauri-logo.png"} alt={product.name} />
          </div>
        </div>
        <div className="sg-product-details">
          <small className="sg-product-eyebrow">SHREE GAURI · AUTHENTIC COLLECTION</small>
          <h1>{product.name}</h1>
          {product.short_description && <p className="sg-product-short">{product.short_description}</p>}
          <div className="sg-product-price">{money(product.price_inr)} {product.compare_at_price_inr && <del>{money(product.compare_at_price_inr)}</del>}</div>
          <small className="sg-product-tax">Inclusive of applicable taxes</small>
          <p className={product.stock_quantity > 0 ? "sg-product-stock" : "sg-product-stock out"}>{product.stock_quantity > 0 ? `In stock · ${product.stock_quantity} available` : "Currently unavailable"}</p>
          <div className="sg-product-quantity"><span>Quantity</span><div><button type="button" onClick={() => setQuantity((n) => Math.max(1, n - 1))}>−</button><b>{quantity}</b><button type="button" disabled={quantity >= Math.min(10, product.stock_quantity)} onClick={() => setQuantity((n) => Math.min(10, product.stock_quantity, n + 1))}>+</button></div></div>
          <div className="sg-product-actions">
            <button type="button" disabled={product.stock_quantity < 1} onClick={() => addToCart(false)}>ADD TO CART</button>
            <button type="button" disabled={product.stock_quantity < 1} onClick={() => addToCart(true)}>BUY NOW</button>
          </div>
          {added && <p role="status">Added to your cart.</p>}
          <div className="sg-product-benefits"><span>✓ Carefully selected products</span><span>✓ Secure checkout</span><span>✓ Pan-India delivery</span></div>
          {product.description && <section className="sg-product-description"><h2>Product Details</h2><p>{product.description}</p></section>}
        </div>
      </section>
      <footer className="sg-product-footer"><span>SHREE GAURI</span><a href="/">Continue shopping</a><a href="/shipping-returns">Shipping & Returns</a><a href="/contact">Contact Us</a></footer>
    </main>
  );
}
