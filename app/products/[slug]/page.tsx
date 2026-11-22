"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function productImage(url: string, width = 720, quality = 72) {
  if (!url) return "/shree-gauri-logo.png";
  const marker = "/storage/v1/object/public/";
  if (!url.includes(marker)) return url;
  const [base, query = ""] = url.split("?");
  const transformed = base.replace(marker, "/storage/v1/render/image/public/");
  const params = new URLSearchParams(query);
  params.set("width", String(width));
  params.set("quality", String(quality));
  params.set("format", "webp");
  params.set("resize", "contain");
  return transformed + "?" + params.toString();
}

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
  const [buyNowBusy, setBuyNowBusy] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState("");
  const [reviews, setReviews] = useState<Array<{id:string; reviewer_name:string; rating:number; title:string; body:string; created_at:string}>>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    let hasCachedProduct = false;
    // Use the catalogue row immediately when the visitor has just clicked a
    // product, then refresh the authoritative detail fields in the background.
    try {
      const cached = sessionStorage.getItem("sg_product_prefetch:" + slug);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.product && Date.now() - Number(parsed.savedAt || 0) < 10 * 60 * 1000) {
          const next = { ...parsed.product, image_urls: Array.isArray(parsed.product.image_urls) ? parsed.product.image_urls : [] } as Product;
          hasCachedProduct = true;
          setProduct(next);
          setActiveImage(next.primary_image_url || next.image_urls?.[0] || "");
          setLoading(false);
        }
      }
    } catch {}
    supabase.from("products").select("id,name,slug,short_description,description,price_inr,compare_at_price_inr,primary_image_url,image_urls,stock_quantity,badge,category_id").eq("slug", slug).eq("is_active", true).maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!alive) return;
        if (queryError || !data) {
          if (!hasCachedProduct) setError("This product is not available right now.");
          setLoading(false);
          return;
        }
        const next = { ...data, image_urls: Array.isArray(data.image_urls) ? data.image_urls : [] } as Product;
        setProduct(next);
        setActiveImage((current) => current || next.primary_image_url || next.image_urls?.[0] || "");
        setLoading(false);
      });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!product?.id) return;
    let alive = true;
    supabase.from("product_reviews")
      .select("id,reviewer_name,rating,title,body,created_at")
      .eq("product_id", product.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (alive && data) setReviews(data as typeof reviews); });
    return () => { alive = false; };
  }, [product?.id]);

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  async function submitReview() {
    if (!product) return;
    setReviewBusy(true);
    setReviewMessage("Submitting your review…");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setReviewMessage("Please sign in to your Customer Account before writing a review.");
      setReviewBusy(false);
      return;
    }
    const reviewerName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Customer";
    const { error } = await supabase.from("product_reviews").upsert({
      product_id: product.id,
      user_id: data.user.id,
      reviewer_name: reviewerName,
      rating: reviewRating,
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      is_approved: false,
    }, { onConflict: "product_id,user_id" });
    setReviewMessage(error?.message || "Thank you. Your review has been submitted and will appear after approval.");
    if (!error) { setReviewTitle(""); setReviewBody(""); setReviewRating(5); }
    setReviewBusy(false);
  }

  const images = useMemo(() => product ? Array.from(new Set([product.primary_image_url, ...(product.image_urls || [])].filter(Boolean))) as string[] : [], [product]);
  const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

  function addToCart(buyNow = false) {
    if (!product || typeof window === "undefined") return;
    if (product.stock_quantity < 1 || quantity < 1 || quantity > product.stock_quantity) {
      setCartActionMessage("This quantity is not currently available.");
      return;
    }
    try {
      const chosen = Array.from({ length: quantity }, () => product);
      if (buyNow) {
        setBuyNowBusy(true);
        setCartActionMessage("");
        // Keep Buy Now separate from the normal cart so storefront hydration
        // or cart persistence cannot replace the exact product being purchased.
        const payload = JSON.stringify(chosen);
        localStorage.setItem("sg_buy_now_cart", payload);
        localStorage.setItem("sg_cart", payload);
        window.location.assign("/?checkout=1&source=product");
        return;
      }
      let current: Product[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem("sg_cart") || "[]");
        if (Array.isArray(parsed)) current = parsed as Product[];
      } catch { current = []; }
      localStorage.setItem("sg_cart", JSON.stringify([...current, ...chosen]));
      window.location.assign("/?cart=1");
    } catch {
      setBuyNowBusy(false);
      setCartActionMessage("Unable to start checkout. Please try again.");
    }
  }

  if (loading) return <main className="sg-product-page"><div className="sg-product-loading">Loading product details…</div></main>;
  if (error || !product) return <main className="sg-product-page"><div className="sg-product-loading"><h1>Product unavailable</h1><p>{error}</p><a href="/">Return to Shree Gauri</a></div></main>;

  return (
    <main className="sg-product-page">
      <header className="sg-product-header">
        <a href="/" className="sg-product-brand"><span>SG</span><b>SHREE GAURI</b><small>DIVINE ENERGY. TIMELESS BEAUTY.</small></a>
        <div className="sg-product-header-links"><a href="/" className="sg-continue-shopping">← CONTINUE SHOPPING</a><a href="/?cart=1" className="sg-product-cart">VIEW CART</a></div>
      </header>
      <nav className="sg-product-breadcrumb"><a href="/">Home</a><span>/</span><a href="/?shop=1">Shop</a><span>/</span><b>{product.name}</b></nav>
      <div className="sg-product-review-summary" aria-live="polite">
        <span className="sg-product-review-stars">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</span>
        <b>{reviews.length ? averageRating.toFixed(1) : "New"}</b>
        <span>{reviews.length} customer review{reviews.length === 1 ? "" : "s"}</span>
      </div>
      <section className="sg-product-detail-layout">
        <div className="sg-product-gallery">
          <div className="sg-product-thumbnails">
            {images.map((url, index) => <button key={url} type="button" className={activeImage === url ? "active" : ""} onClick={() => setActiveImage(url)} aria-label={`View image ${index + 1}`}><img src={productImage(url, 180, 62)} onError={(e) => { e.currentTarget.src = url; }} alt="" loading="lazy" decoding="async" /></button>)}
          </div>
          <div className="sg-product-image-stage">
            {product.badge && <span className="sg-product-badge">{product.badge}</span>}
            <img src={productImage(activeImage || "", 1400, 80)} onError={(e) => { e.currentTarget.src = activeImage || "/shree-gauri-logo.png"; }} alt={product.name} fetchPriority="high" decoding="async" />
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
            <button type="button" disabled={buyNowBusy || product.stock_quantity < 1} onClick={() => addToCart(true)}>{buyNowBusy ? "OPENING CHECKOUT…" : "BUY NOW"}</button>
          </div>
          {added && <p role="status">Added to your cart.</p>}
          {cartActionMessage && <p className="sg-product-action-message" role="alert">{cartActionMessage}</p>}
          <div className="sg-product-benefits"><span>✓ Carefully selected products</span><span>✓ Secure checkout</span><span>✓ Pan-India delivery</span></div>
          {product.description && <section className="sg-product-description"><h2>Product Details</h2><p>{product.description}</p></section>}
        </div>
      </section>
      <section className="sg-product-reviews" aria-labelledby="sg-reviews-heading">
        <div className="sg-reviews-heading">
          <div><small>REAL CUSTOMER EXPERIENCES</small><h2 id="sg-reviews-heading">Customer Reviews</h2></div>
          <div className="sg-reviews-score"><b>{reviews.length ? averageRating.toFixed(1) : "—"}</b><span className="sg-product-review-stars">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</span><small>{reviews.length} approved review{reviews.length === 1 ? "" : "s"}</small></div>
        </div>
        {reviews.length ? <div className="sg-review-list">{reviews.map((review) => <article className="sg-review-card" key={review.id}>
          <div className="sg-product-review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
          <h3>{review.title}</h3><p>{review.body}</p>
          <small>{review.reviewer_name} · {new Date(review.created_at).toLocaleDateString("en-IN")}</small>
        </article>)}</div> : <p className="sg-no-reviews">No approved reviews yet. Be the first customer to share your experience.</p>}
        <form className="sg-review-form" onSubmit={(event) => { event.preventDefault(); void submitReview(); }}>
          <h3>Write a Review</h3>
          <p>Share your experience with this product.</p>
          <label>Your rating</label>
          <div className="sg-review-stars-picker">{[1,2,3,4,5].map((n) => <button key={n} type="button" aria-label={`Rate ${n} out of 5`} aria-pressed={reviewRating === n} onClick={() => setReviewRating(n)}>{n <= reviewRating ? "★" : "☆"}</button>)}</div>
          <label htmlFor="sg-review-title">Review title</label>
          <input id="sg-review-title" value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} minLength={2} maxLength={100} required placeholder="Summarise your experience" />
          <label htmlFor="sg-review-body">Your review</label>
          <textarea id="sg-review-body" value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} minLength={5} maxLength={2000} required placeholder="What did you like about this product?" />
          <button type="submit" disabled={reviewBusy || reviewTitle.trim().length < 2 || reviewBody.trim().length < 5}>{reviewBusy ? "SUBMITTING…" : "SUBMIT REVIEW"}</button>
          {reviewMessage && <small role="status">{reviewMessage}</small>}
          <small>Reviews are checked before they appear publicly. Customer sign-in is required.</small>
        </form>
      </section>
      <footer className="sg-product-footer"><span>SHREE GAURI</span><a href="/">Continue shopping</a><a href="/shipping-returns">Shipping & Returns</a><a href="/contact">Contact Us</a></footer>
    </main>
  );
}
