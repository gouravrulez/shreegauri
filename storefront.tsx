"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  Gem,
  Minus,
  Plus,
  Share2,
  UserRound,
  MessageCircle,
  Mail,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa6";

type C = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  collection_type: "category" | "purpose" | "planet";
};
type P = {
  id: string;
  category_id: string | null;
  category_ids: string[];
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_inr: number;
  compare_at_price_inr: number | null;
  primary_image_url: string;
  image_urls: string[];
  stock_quantity: number;
  is_featured: boolean;
  badge: string | null;
};
type R = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
};
type Checkout = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};
type CurrencyCode = "INR" | "USD" | "GBP" | "EUR" | "AED" | "CAD" | "AUD" | "SGD";
type SavedAddress = {
  id: string;
  label: string;
  recipient_name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};
type S = {
  announcement: string;
  hero_title: string;
  hero_text: string;
  hero_image_url: string;
  brand_logo_url: string;
  founder_image_url: string;
  founder_message: string;
  founder_name: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
};
const fallback: S = {
  announcement:
    "OPEN 24/7 (Including Sundays)  |  Secure Shopping  |  Limited One-of-One Products",
  hero_title: "Divine Energy. Timeless Beauty.",
  hero_text:
    "Gemstones, sacred jewellery, Rudraksha and spiritual products thoughtfully selected for meaningful living.",
  hero_image_url: "/maa-lakshmi-hero-fast.webp",
  brand_logo_url: "",
  founder_image_url: "",
  founder_message:
    "At Shree Gauri, the things we wear and keep close can carry more than beauty. They can carry meaning, memories, tradition and a sense of connection. Every collection is selected with thoughtful care and transparent service at its heart.",
  founder_name: "Gourav Sharma",
  whatsapp: "917400617601",
  email: "gauritechnologiespvt@gmail.com",
  instagram: "https://instagram.com/shreegauri.in",
  facebook: "https://www.facebook.com/share/1GPZb8oxNN/?mibextid=wwXIfr",
};

export default function Storefront() {
  const [cats, setCats] = useState<C[]>([]),
    [products, setProducts] = useState<P[]>([]),
    [reviews, setReviews] = useState<R[]>([]),
    [s, setS] = useState(fallback),
    [view, setView] = useState("home"),
    [q, setQ] = useState(""),
    [menu, setMenu] = useState(false),
    [item, setItem] = useState<P | null>(null),
    [selectedImage, setSelectedImage] = useState(""),
    [qty, setQty] = useState(1),
    [cart, setCart] = useState<P[]>(() => {
      if (typeof window === "undefined") return [];
      try { return JSON.parse(localStorage.getItem("sg_cart") || "[]"); } catch { return []; }
    }),
    [wish, setWish] = useState<string[]>([]),
    [sort, setSort] = useState("featured"),
    [categoryFilter, setCategoryFilter] = useState("all"),
    [stockOnly, setStockOnly] = useState(false),
    [maxPrice, setMaxPrice] = useState(""),
    [filtersOpen, setFiltersOpen] = useState(false),
    [rating, setRating] = useState(5),
    [reviewTitle, setReviewTitle] = useState(""),
    [reviewBody, setReviewBody] = useState(""),
    [reviewMsg, setReviewMsg] = useState(""),
    [checkoutOpen, setCheckoutOpen] = useState(false),
    [checkoutBusy, setCheckoutBusy] = useState(false),
    [checkoutMsg, setCheckoutMsg] = useState(""),
    [checkoutAddresses, setCheckoutAddresses] = useState<SavedAddress[]>([]),
    [selectedAddressId, setSelectedAddressId] = useState(""),
    [currency, setCurrency] = useState<CurrencyCode>(() => {
      if (typeof window === "undefined") return "INR";
      return (localStorage.getItem("sg_currency") as CurrencyCode) || "INR";
    }),
    [checkout, setCheckout] = useState<Checkout>({
      name: "",
      email: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: typeof window === "undefined" ? "India" : (localStorage.getItem("sg_country") || "India"),
    });
  useEffect(() => {
    localStorage.setItem("sg_currency", currency);
  }, [currency]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("sg_country", checkout.country);
  }, [checkout.country]);

  useEffect(() => {
    Promise.all([
      supabase
        .from("categories")
        .select("id,name,slug,description,image_url,parent_id,collection_type")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("products")
        .select(
          "id,category_id,category_ids,name,slug,short_description,description,price_inr,compare_at_price_inr,primary_image_url,image_urls,stock_quantity,is_featured,badge",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("id", 1).single(),
      supabase
        .from("product_reviews")
        .select("id,product_id,reviewer_name,rating,title,body,created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
    ]).then(([a, b, d, r]) => {
      if (a.data) setCats(a.data as C[]);
      if (b.data)
        setProducts(
          b.data.map((p: any) => ({
            ...p,
            image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            category_ids:
              Array.isArray(p.category_ids) && p.category_ids.length
                ? p.category_ids
                : p.category_id
                  ? [p.category_id]
                  : [],
          })) as P[],
        );
      if (d.data)
        setS({ ...d.data, hero_image_url: "/maa-lakshmi-hero-fast.webp" } as S);
      if (r.data) setReviews(r.data as R[]);
    });
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("sg_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("checkout") === "1") {
      openSecureCheckout();
    }
  }, []);

  async function openSecureCheckout() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem("sg_cart", JSON.stringify(cart));
      window.location.href = "/login?returnTo=checkout";
      return;
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    const profileName = customer?.full_name || session.user.user_metadata?.full_name || "";
    const profileEmail = customer?.email || session.user.email || "";
    const profilePhone = customer?.phone || session.user.phone || "";

    let addresses: SavedAddress[] = [];
    if (customer?.id) {
      const { data } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      addresses = (data || []) as SavedAddress[];
    }

    setCheckoutAddresses(addresses);
    const chosen = addresses.find((a) => a.is_default) || addresses[0];
    setSelectedAddressId(chosen?.id || "");
    setCheckout({
      name: chosen?.recipient_name || profileName,
      email: profileEmail,
      phone: chosen?.phone || profilePhone,
      line1: chosen?.line1 || "",
      line2: chosen?.line2 || "",
      city: chosen?.city || "",
      state: chosen?.state || "",
      pincode: chosen?.pincode || "",
      country: chosen ? "India" : (checkout.country || "India"),
    });
    setCheckoutMsg(addresses.length ? "" : "Add a delivery address here or save one in My Account.");
    setCheckoutOpen(true);
  }

  function chooseCheckoutAddress(id: string) {
    setSelectedAddressId(id);
    const a = checkoutAddresses.find((x) => x.id === id);
    if (!a) return;
    setCheckout((c) => ({
      ...c,
      name: a.recipient_name || c.name,
      phone: a.phone || c.phone,
      line1: a.line1,
      line2: a.line2 || "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: "India",
    }));
  }


  const fastImage = (url: string, width = 520, quality = 72) => {
    if (!url) return url;
    try {
      const u = new URL(url);
      if (
        u.hostname.endsWith(".supabase.co") &&
        u.pathname.includes("/storage/v1/object/public/")
      ) {
        u.pathname = u.pathname.replace(
          "/storage/v1/object/public/",
          "/storage/v1/render/image/public/",
        );
        u.searchParams.set("width", String(width));
        u.searchParams.set("quality", String(quality));
        u.searchParams.set("resize", "contain");
        return u.toString();
      }
    } catch {}
    return url;
  };

  const fxPerInr: Record<CurrencyCode, number> = {
    INR: 1, USD: 0.0111, GBP: 0.0082, EUR: 0.0095, AED: 0.0408,
    CAD: 0.0152, AUD: 0.0168, SGD: 0.0143,
  };
  const currencyLocale: Record<CurrencyCode, string> = {
    INR: "en-IN", USD: "en-US", GBP: "en-GB", EUR: "en-IE", AED: "en-AE",
    CAD: "en-CA", AUD: "en-AU", SGD: "en-SG",
  };
  const money = (n: number) => {
    const converted = n * fxPerInr[currency];
    return new Intl.NumberFormat(currencyLocale[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "INR" ? 0 : 2,
    }).format(converted);
  };
  const go = (v: string) => {
    setView(v);
    setMenu(false);
    setItem(null);
    setTimeout(() => {
      const isCatalogView =
        v === "shop" ||
        v === "new" ||
        v === "best" ||
        cats.some((c) => c.slug === v);
      const catalog = document.getElementById("products-section");
      if (isCatalogView && catalog) {
        catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: v === "home" ? 0 : 560, behavior: "smooth" });
      }
    }, 80);
  };
  const wa = (t: string) =>
    `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(t)}`;
  const ratingFor = (id: string) => {
    const rr = reviews.filter((r) => r.product_id === id);
    return {
      count: rr.length,
      average: rr.length ? rr.reduce((a, r) => a + r.rating, 0) / rr.length : 0,
    };
  };
  async function submitReview() {
    if (!item) return;
    setReviewMsg("Submitting...");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setReviewMsg("Please use Customer Login before writing a review.");
      return;
    }
    const name =
      data.user.user_metadata?.full_name ||
      data.user.email?.split("@")[0] ||
      "Customer";
    const { error } = await supabase.from("product_reviews").upsert(
      {
        product_id: item.id,
        user_id: data.user.id,
        reviewer_name: name,
        rating,
        title: reviewTitle,
        body: reviewBody,
        is_approved: false,
      },
      { onConflict: "product_id,user_id" },
    );
    setReviewMsg(
      error?.message || "Thank you. Your review will appear after approval.",
    );
    if (!error) {
      setReviewTitle("");
      setReviewBody("");
      setRating(5);
    }
  }
  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (!cart.length) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem("sg_cart", JSON.stringify(cart));
      window.location.href = "/login?returnTo=checkout";
      return;
    }
    setCheckoutBusy(true);
    setCheckoutMsg("Opening secure payment...");
    const grouped = Object.values(
      cart.reduce(
        (a, p) => {
          a[p.id] ??= { product_id: p.id, quantity: 0 };
          a[p.id].quantity++;
          return a;
        },
        {} as Record<string, { product_id: string; quantity: number }>,
      ),
    );
    const payload = {
      customer: {
        name: checkout.name,
        email: checkout.email,
        phone: checkout.phone,
      },
      address: {
        line1: checkout.line1,
        line2: checkout.line2,
        city: checkout.city,
        state: checkout.state,
        pincode: checkout.pincode,
        country: checkout.country,
      },
      items: grouped,
    };
    if (checkout.country !== "India") {
      setCheckoutBusy(false);
      setCheckoutMsg("International online payment is not enabled yet. Please contact Shree Gauri for shipping and payment options for your destination.");
      return;
    }
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error);
      if (order.provider === "phonepe" && order.redirect_url) {
        setCheckoutMsg("Redirecting to secure PhonePe checkout...");
        window.location.assign(order.redirect_url);
        return;
      }
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Razorpay."));
          document.head.appendChild(script);
        });
      }
      const razorpay = new (window as any).Razorpay({
        key: order.key,
        amount: order.amount,
        currency: "INR",
        name: "Shree Gauri",
        description: `Order ${order.order_number}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: checkout.name,
          email: checkout.email,
          contact: checkout.phone,
        },
        theme: { color: "#7b1420" },
        handler: async (payment: any) => {
          setCheckoutMsg("Verifying payment...");
          const verified = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payment,
              store_order_id: order.store_order_id,
            }),
          });
          const result = await verified.json();
          if (!verified.ok) {
            setCheckoutBusy(false);
            setCheckoutMsg(
              result.error || "Payment verification failed. Please contact us.",
            );
            return;
          }
          setCart([]);
          setCheckoutBusy(false);
          setCheckoutMsg(
            `Payment successful. Order ${result.order_number} is confirmed.`,
          );
        },
      });
      razorpay.on("payment.failed", (failure: any) => {
        setCheckoutBusy(false);
        setCheckoutMsg(
          failure.error?.description ||
            "Payment was not completed. Please try again.",
        );
      });
      razorpay.open();
      setCheckoutBusy(false);
    } catch (error) {
      setCheckoutBusy(false);
      setCheckoutMsg(
        error instanceof Error ? error.message : "Unable to start payment.",
      );
    }
  }
  const shown = useMemo(() => {
    const activeCategory = cats.find((c) => c.slug === view)?.id;
    const list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) &&
        (view === "home" ||
          view === "shop" ||
          view === "new" ||
          view === "best" ||
          activeCategory === p.category_id ||
          (!!activeCategory && p.category_ids.includes(activeCategory))) &&
        (view !== "best" || p.is_featured) &&
        (categoryFilter === "all" ||
          p.category_id === categoryFilter ||
          p.category_ids.includes(categoryFilter)) &&
        (!stockOnly || p.stock_quantity > 0) &&
        (!maxPrice || Number(p.price_inr) <= Number(maxPrice)),
    );
    return [...list].sort((a, b) =>
      sort === "price-low"
        ? Number(a.price_inr) - Number(b.price_inr)
        : sort === "price-high"
          ? Number(b.price_inr) - Number(a.price_inr)
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : sort === "featured"
              ? Number(b.is_featured) - Number(a.is_featured)
              : 0,
    );
  }, [products, q, view, cats, categoryFilter, stockOnly, maxPrice, sort]);
  const announcementText = (s.announcement || fallback.announcement)
    .replace(/Free Shipping Pan India/gi, "India & Worldwide Support")
    .replace(/Free shipping across India/gi, "India & Worldwide Support");
  const nav = [
    ["home", "Home"],
    ["shop", "Categories"],
    ["new", "New Arrivals"],
    ["best", "Best Sellers"],
    ["about", "About Us"],
    ["contact", "Contact Us"],
  ];
  return (
    <main>
      <div className="topbar">
        <span>{announcementText}</span>
        <span className="social-tools">
          Follow Us:{" "}
          <a href={s.instagram} aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href={s.facebook} aria-label="Facebook">
            <FaFacebookF />
          </a>
        </span>
      </div>
      <header>
        <button className="hamb" onClick={() => setMenu(true)}>
          <Menu />
        </button>
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="Shree Gauri home"
        >
          <i className="sg-mark" aria-hidden="true">
            SG
          </i>
          <span>
            <b>SHREE GAURI</b>
            <small>Divine Energy. Timeless Beauty.</small>
          </span>
        </button>
        <label className="search">
          <Search />
          <input
            placeholder="Search Shree Gauri products..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setView("shop");
            }}
          />
        </label>
        <div className="head-actions">
          <a href="/login">
            <UserRound />
            <span>Login</span>
          </a>
          <button onClick={() => go("wishlist")}>
            <Heart />
            <span>Wishlist</span>
            <em>{wish.length}</em>
          </button>
          <button onClick={() => go("cart")}>
            <ShoppingBag />
            <span>Cart</span>
            <em>{cart.length}</em>
          </button>
        </div>
      </header>
      <nav>
        {nav.map(([v, l]) => (
          <button
            key={v}
            className={view === v ? "sel" : ""}
            onClick={() => go(v)}
          >
            {l}
          </button>
        ))}
      </nav>
      <section className="international-selector-bar" aria-label="International shopping preferences">
        <div className="international-selector-inner">
          <strong>🌍 Shop Worldwide</strong>
          <label>
            <span>Country / Region</span>
            <select
              value={checkout.country}
              onChange={(e) => setCheckout({ ...checkout, country: e.target.value })}
              aria-label="Select country or region"
            >
              <option>India</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>United Arab Emirates</option>
              <option>Canada</option>
              <option>Australia</option>
              <option>Singapore</option>
              <option>European Union</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            <span>Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              aria-label="Select display currency"
            >
              {(["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD", "SGD"] as CurrencyCode[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <small>International prices are approximate until checkout availability is confirmed.</small>
        </div>
      </section>
      {menu && (
        <aside className="drawer">
          <button onClick={() => setMenu(false)}>
            <X />
          </button>
          <h2>SHREE GAURI</h2>
          {nav.map(([v, l]) => (
            <button key={v} onClick={() => go(v)}>
              {l}
              <ChevronRight />
            </button>
          ))}
          <a href="/login">
            Customer Login <ChevronRight />
          </a>
        </aside>
      )}
      {view === "home" && (
        <>
          <section className="hero-v2 hero-loaded">
            <div
              className="hero-art"
              style={{
                backgroundImage: `linear-gradient(90deg,transparent 56%,rgba(255,238,185,.12) 72%,rgba(255,228,155,.72) 100%),url(/maa-lakshmi-hero-fast.webp)`,
              }}
            />
            <div className="hero-copy-v2">
              <small>WELCOME TO</small>
              <h1>SHREE GAURI</h1>
              <div className="gold-rule" />
              <h2>{s.hero_title}</h2>
              <p>{s.hero_text}</p>
              <blockquote>“Where devotion meets timeless beauty.”</blockquote>
              <div className="hero-buttons">
                <button onClick={() => go("shop")}>SHOP NOW</button>
                <button className="ghost" onClick={() => go("shop")}>
                  EXPLORE COLLECTIONS
                </button>
              </div>
            </div>
            <span className="sacred-mark">श्रीं</span>
          </section>
          <section className="trust">
            <div>
              <ShieldCheck />
              <b>Carefully Selected</b>
              <small>Chosen with care</small>
            </div>
            <div>
              <Gem />
              <b>Thoughtful Collections</b>
              <small>Meaningful selections</small>
            </div>
            <div>
              <PackageCheck />
              <b>Secure Packaging</b>
              <small>Delivered with care</small>
            </div>
            <div>
              <Sparkles />
              <b>Open 24/7</b>
              <small>Including Sundays</small>
            </div>
          </section>
          <section className="international-note">
            <b>Shree Gauri Worldwide</b>
            <span>Browse in INR, USD, GBP, EUR, AED, CAD, AUD or SGD.</span>
            <small>Non-INR prices are approximate display conversions. Shipping availability, delivery times, customs duties and taxes vary by destination.</small>
          </section>
          <section className="devotion-note">
            <span>✦</span>
            <p>
              Chosen with reverence, presented with honesty, and delivered with
              care.
            </p>
            <span>✦</span>
          </section>
        </>
      )}
      {(view === "home" || view === "shop") && (
        <>
          <section className="section">
            <small className="kicker">DISCOVER YOUR BLESSING</small>
            <h2>Shop by Category</h2>
            <p className="intro">
              A thoughtfully curated world of beauty, devotion and positive
              energy.
            </p>
            <div className="cat-grid">
              {cats
                .filter((c) => !c.parent_id && c.collection_type === "category")
                .map((c) => (
                  <button key={c.id} onClick={() => go(c.slug)}>
                    <div>
                      {c.image_url ? (
                        <img src={fastImage(c.image_url, 240, 68)} alt={c.name} loading="lazy" decoding="async" width={240} height={240} />
                      ) : (
                        <span className="category-symbol">✦</span>
                      )}
                    </div>
                    <h3>{c.name}</h3>
                  </button>
                ))}
            </div>
          </section>
          <section className="section purpose-section">
            <small className="kicker">CHOOSE YOUR INTENTION</small>
            <h2>Shop by Purpose</h2>
            <p className="intro">
              Find meaningful selections aligned with what matters most to you.
            </p>
            <div className="purpose-grid">
              {cats
                .filter((c) => c.collection_type === "purpose")
                .map((c) => (
                  <button key={c.id} onClick={() => go(c.slug)}>
                    <div>
                      {c.image_url ? (
                        <img src={fastImage(c.image_url, 240, 68)} alt={c.name} loading="lazy" decoding="async" width={240} height={240} />
                      ) : (
                        <span>✦</span>
                      )}
                    </div>
                    <h3>{c.name}</h3>
                  </button>
                ))}
            </div>
          </section>
          <section className="section planet-section">
            <small className="kicker">VEDIC PLANETARY WISDOM</small>
            <h2>Shop by Planet</h2>
            <p className="intro">
              Explore products traditionally connected with the Navagraha.
            </p>
            <div className="planet-grid">
              {cats
                .filter((c) => c.collection_type === "planet")
                .map((c) => (
                  <button key={c.id} onClick={() => go(c.slug)}>
                    <div>
                      {c.image_url ? (
                        <img src={fastImage(c.image_url, 240, 68)} alt={c.name} loading="lazy" decoding="async" width={240} height={240} />
                      ) : (
                        <span>
                          {(
                            {
                              Sun: "☉",
                              Moon: "☾",
                              Mars: "♂",
                              Mercury: "☿",
                              Jupiter: "♃",
                              Venus: "♀",
                              Saturn: "♄",
                              Rahu: "☊",
                              Ketu: "☋",
                            } as Record<string, string>
                          )[c.name] || "✦"}
                        </span>
                      )}
                    </div>
                    <h3>{c.name}</h3>
                  </button>
                ))}
            </div>
          </section>
        </>
      )}
      {(view === "home" ||
        view === "shop" ||
        view === "new" ||
        view === "best" ||
        cats.some((c) => c.slug === view)) && (
        <section id="products-section" className="section cream catalog">
          <small className="kicker">CURATED FOR YOU</small>
          <h2>
            {view === "home"
              ? "TOP PICKS"
              : view === "new"
                ? "NEW ARRIVALS"
                : view === "best"
                  ? "BEST SELLERS"
                  : cats.find((c) => c.slug === view)?.name.toUpperCase() ||
                    "COLLECTION"}
          </h2>
          <div className="catalog-toolbar">
            <span>
              {shown.length} {shown.length === 1 ? "PRODUCT" : "PRODUCTS"}
            </span>
            <button
              className="filter-toggle"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal /> FILTER
            </button>
            <label>
              SORT BY{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
          <div className="catalog-layout">
            <aside className={`filters ${filtersOpen ? "open" : ""}`}>
              <div className="filter-title">
                <b>FILTER PRODUCTS</b>
                <button onClick={() => setFiltersOpen(false)}>
                  <X />
                </button>
              </div>
              <fieldset>
                <legend>Category</legend>
                <label>
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === "all"}
                    onChange={() => setCategoryFilter("all")}
                  />{" "}
                  All Categories
                </label>
                {cats
                  .filter((c) => c.collection_type === "category")
                  .map((c) => (
                    <label key={c.id}>
                      <input
                        type="radio"
                        name="category"
                        checked={categoryFilter === c.id}
                        onChange={() => setCategoryFilter(c.id)}
                      />{" "}
                      {c.name}
                    </label>
                  ))}
              </fieldset>
              <fieldset>
                <legend>Price</legend>
                <label className="price-filter">
                  Up to ₹
                  <input
                    type="number"
                    min="0"
                    placeholder="Any price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </label>
              </fieldset>
              <fieldset>
                <legend>Availability</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={stockOnly}
                    onChange={(e) => setStockOnly(e.target.checked)}
                  />{" "}
                  In stock only
                </label>
              </fieldset>
              <button
                className="clear-filters"
                onClick={() => {
                  setCategoryFilter("all");
                  setStockOnly(false);
                  setMaxPrice("");
                  setQ("");
                }}
              >
                CLEAR ALL
              </button>
            </aside>
            <div className="product-grid">
              {shown.length ? (
                shown.map((p) => (
                  <article key={p.id}>
                    <button
                      className="heart"
                      onClick={() =>
                        setWish((w) =>
                          w.includes(p.id)
                            ? w.filter((x) => x !== p.id)
                            : [...w, p.id],
                        )
                      }
                    >
                      <Heart
                        fill={wish.includes(p.id) ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      className="photo"
                      onClick={() => {
                        setItem(p);
                        setQty(1);
                      }}
                    >
                      <img
                        src={
                          p.primary_image_url
                            ? fastImage(p.primary_image_url, 520, 72)
                            : "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=520&q=72"
                        }
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        width={520}
                        height={520}
                      />
                      {p.badge && <span>{p.badge}</span>}
                    </button>
                    <div className="info">
                      <small>SHREE GAURI</small>
                      <h3>{p.name}</h3>
                      <p>{p.short_description || p.description}</p>
                      <b>{money(Number(p.price_inr))}</b>
                      {p.compare_at_price_inr && (
                        <del>{money(Number(p.compare_at_price_inr))}</del>
                      )}
                      <div>
                        <button onClick={() => setCart((c) => [...c, p])}>
                          ADD TO CART
                        </button>
                        <a
                          href={wa(
                            `Hello Shree Gauri, I want to buy ${p.name}.`,
                          )}
                        >
                          BUY NOW
                        </a>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty">
                  No products match these filters. Try clearing a filter or
                  check back when the collection is added.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
      {view === "about" && (
        <section className="simple">
          <small className="kicker">OUR STORY</small>
          <h1>Rooted in devotion. Chosen with care.</h1>
          <p>
            Shree Gauri brings together gemstones, jewellery and
            spiritual essentials in one thoughtfully curated destination. Meaningful products
            deserve honest guidance, careful selection and warm service.
          </p>
        </section>
      )}
      {view === "contact" && (
        <section className="simple">
          <small className="kicker">HERE FOR YOU 24/7</small>
          <h1>Connect with Shree Gauri</h1>
          <div className="contacts">
            <a href={`https://wa.me/${s.whatsapp}`}>
              WhatsApp · +91 7400617601
            </a>
            <a href={`mailto:${s.email}`}>{s.email}</a>
            <a href={s.instagram}>Instagram · @shreegauri.in</a>
            <a href={s.facebook}>Facebook</a>
          </div>
        </section>
      )}
      {view === "wishlist" && (
        <section className="simple">
          <h1>Your Wishlist</h1>
          <p>
            {wish.length
              ? `${wish.length} special item(s) saved.`
              : "Your wishlist is waiting for something special."}
          </p>
          <button className="gold" onClick={() => go("shop")}>
            CONTINUE SHOPPING
          </button>
        </section>
      )}
      {view === "cart" && (
        <section className="simple">
          <h1>Your Cart</h1>
          {cart.map((p, i) => (
            <div className="cart" key={i}>
              <img src={fastImage(p.primary_image_url, 160, 65)} alt={p.name} loading="lazy" decoding="async" width={160} height={160} />
              <b>{p.name}</b>
              <span>{money(Number(p.price_inr))}</span>
              <button
                onClick={() => setCart((c) => c.filter((_, x) => x !== i))}
              >
                <X />
              </button>
            </div>
          ))}
          {cart.length ? (
            <>
              <h3 className="cart-total">
                Total:{" "}
                {money(cart.reduce((sum, p) => sum + Number(p.price_inr), 0))}
              </h3>
              <button
                className="gold link"
                onClick={openSecureCheckout}
              >
                PLACE ORDER
              </button>
            </>
          ) : (
            <p>Your cart is empty.</p>
          )}
        </section>
      )}
      <section className="founder">
        <img
          src={s.founder_image_url || "/gourav-sharma-founder.jpeg"}
          alt="Gourav Sharma, Founder of Shree Gauri"
          loading="lazy"
          decoding="async"
        />
        <div>
          <small className="kicker">A PERSONAL NOTE</small>
          <h2>A Message from Our Founder</h2>
          <blockquote>“{s.founder_message}”</blockquote>
          <b>{s.founder_name}</b>
          <span>Founder, Shree Gauri</span>
        </div>
      </section>
      <footer>
        <div>
          <h2>SHREE GAURI</h2>
          <a href="https://www.shreegauri.in">www.shreegauri.in</a>
          <a href="mailto:gauritechnologiespvt@gmail.com">
            gauritechnologiespvt@gmail.com
          </a>
          <a href="tel:+917400617601">+91 74006 17601</a>
        </div>
        <div>
          <b>Explore</b>
          {cats
            .filter((c) => c.collection_type === "category")
            .slice(0, 5)
            .map((c) => (
              <button key={c.id} onClick={() => go(c.slug)}>
                {c.name}
              </button>
            ))}
        </div>
        <div>
          <b>Help</b>
          <button onClick={() => go("about")}>About Us</button>
          <button onClick={() => go("contact")}>Contact Us</button>
          <a href="/login">Customer Login</a>
          <a href="/shipping-returns">Shipping & Returns</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
        <div className="footer-connect">
          <b>Connect</b>
          <a href={wa("Hello Shree Gauri")}>
            <FaWhatsapp />
            WhatsApp
          </a>
          <a href={s.instagram}>
            <FaInstagram />
            Instagram
          </a>
          <a href={`mailto:${s.email}`}>
            <Mail />
            Email Us
          </a>
          <a href={s.facebook}>
            <FaFacebookF />
            Facebook
          </a>
        </div>
        <small>© 2026 Shree Gauri. All rights reserved.</small>
      </footer>
      <a
        className="wa"
        href={wa("Hello Shree Gauri, I would like help choosing a product.")}
        aria-label="Chat with Shree Gauri on WhatsApp"
      >
        <i>
          <MessageCircle />
        </i>
        <span>Chat with us</span>
      </a>
      {checkoutOpen && (
        <div
          className="backdrop"
          onClick={() => !checkoutBusy && setCheckoutOpen(false)}
        >
          <form
            className="checkout-modal"
            onSubmit={placeOrder}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="close"
              onClick={() => setCheckoutOpen(false)}
            >
              <X />
            </button>
            <small className="kicker">SECURE CHECKOUT</small>
            <h2>Delivery Details</h2>
            <p>
              Select a saved delivery address or enter another address. India orders can continue to secure PhonePe payment; international availability is confirmed by destination.
            </p>
            {checkoutAddresses.length > 0 && (
              <label className="checkout-address-select">
                Saved Address
                <select value={selectedAddressId} onChange={(e) => chooseCheckoutAddress(e.target.value)}>
                  {checkoutAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}{a.is_default ? " (Default)" : ""} — {a.line1}, {a.city}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="checkout-account-note">
              Logged-in checkout • <a href="/login?section=addresses">Manage saved addresses</a>
            </p>
            <div className="checkout-grid">
              <label>
                Full Name
                <input
                  required
                  value={checkout.name}
                  onChange={(e) =>
                    setCheckout({ ...checkout, name: e.target.value })
                  }
                />
              </label>
              <label>
                Mobile Number
                <input
                  required
                  inputMode="tel"
                  value={checkout.phone}
                  onChange={(e) =>
                    setCheckout({ ...checkout, phone: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Email Address
                <input
                  type="email"
                  value={checkout.email}
                  onChange={(e) =>
                    setCheckout({ ...checkout, email: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Address
                <input
                  required
                  value={checkout.line1}
                  onChange={(e) =>
                    setCheckout({ ...checkout, line1: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Apartment / Landmark
                <input
                  value={checkout.line2}
                  onChange={(e) =>
                    setCheckout({ ...checkout, line2: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Country / Region
                <select required value={checkout.country} onChange={(e) => setCheckout({ ...checkout, country: e.target.value })}>
                  <option>India</option><option>United States</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Canada</option><option>Australia</option><option>Singapore</option><option>European Union</option><option>Other</option>
                </select>
              </label>
              <label>
                City
                <input
                  required
                  value={checkout.city}
                  onChange={(e) =>
                    setCheckout({ ...checkout, city: e.target.value })
                  }
                />
              </label>
              <label>
                State / Province / Region
                <input
                  required
                  value={checkout.state}
                  onChange={(e) =>
                    setCheckout({ ...checkout, state: e.target.value })
                  }
                />
              </label>
              <label>
                Postal / ZIP Code
                <input
                  required
                  inputMode={checkout.country === "India" ? "numeric" : "text"}
                  pattern={checkout.country === "India" ? "[0-9]{6}" : undefined}
                  value={checkout.pincode}
                  onChange={(e) =>
                    setCheckout({ ...checkout, pincode: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="checkout-summary">
              <b>{cart.length} item(s)</b>
              <strong>
                {money(cart.reduce((sum, p) => sum + Number(p.price_inr), 0))}
              </strong>
            </div>
            {currency !== "INR" && <p className="fx-note">Approximate display conversion only. India checkout is charged in INR.</p>}
            {checkout.country !== "India" && <p className="international-checkout-note">International online payment is not enabled yet. Contact us at <a href={`mailto:${s.email}`}>{s.email}</a> for destination-specific shipping and payment options.</p>}
            <button className="place-order" disabled={checkoutBusy || checkout.country !== "India"}>
              {checkoutBusy
                ? "STARTING PAYMENT..."
                : checkout.country === "India" ? "PROCEED TO SECURE PAYMENT" : "INTERNATIONAL PAYMENT NOT ENABLED"}
            </button>
            {checkoutMsg && <p className="checkout-message">{checkoutMsg}</p>}
          </form>
        </div>
      )}
      {item && (
        <div className="backdrop" onClick={() => setItem(null)}>
          <div
            className="modal product-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setItem(null)}>
              <X />
            </button>
            <div className="product-gallery">
              <div className="gallery-thumbs">
                {[item.primary_image_url, ...(item.image_urls || [])]
                  .filter(Boolean)
                  .map((url, i) => (
                    <button
                      key={url + i}
                      className={
                        (selectedImage || item.primary_image_url) === url
                          ? "active"
                          : ""
                      }
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`${item.name} view ${i + 1}`} />
                    </button>
                  ))}
              </div>
              <img
                className="gallery-main"
                src={selectedImage || item.primary_image_url}
                alt={item.name}
              />
            </div>
            <div className="product-copy">
              <small className="kicker">CAREFULLY SELECTED • THOUGHTFULLY PRESENTED</small>
              <h2>{item.name}</h2>
              <div className="rating-line">
                <span>
                  {ratingFor(item.id).average
                    ? ratingFor(item.id).average.toFixed(1)
                    : "NEW"}
                </span>
                <span className="stars">
                  {ratingFor(item.id).count
                    ? "★".repeat(Math.round(ratingFor(item.id).average)) +
                      "☆".repeat(5 - Math.round(ratingFor(item.id).average))
                    : "☆☆☆☆☆"}
                </span>
                <span>{ratingFor(item.id).count} review(s)</span>
              </div>
              <p>{item.description || item.short_description}</p>
              <h3>{money(Number(item.price_inr))}</h3>
              <span className={item.stock_quantity ? "in-stock" : "out-stock"}>
                {item.stock_quantity
                  ? `In stock · Only ${item.stock_quantity} available`
                  : "Currently unavailable"}
              </span>
              <div className="purchase-promises">
                <span>
                  <ShieldCheck />
                  Carefully selected products
                </span>
                <span>
                  <PackageCheck />
                  Secure packaging
                </span>
              </div>
              <div className="quantity">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>
                  <Minus />
                </button>
                <b>{qty}</b>
                <button onClick={() => setQty(qty + 1)}>
                  <Plus />
                </button>
              </div>
              <div className="buy">
                <button
                  onClick={() => {
                    setCart((c) => [...c, ...Array(qty).fill(item)]);
                    setItem(null);
                  }}
                >
                  ADD TO CART
                </button>
                <a
                  href={wa(
                    `Hello Shree Gauri, I want to buy ${qty} × ${item.name}.`,
                  )}
                >
                  BUY NOW
                </a>
              </div>
              <div className="share">
                <button
                  onClick={() => setWish((w) => [...new Set([...w, item.id])])}
                >
                  <Heart /> Add to Wishlist
                </button>
                <button
                  onClick={() =>
                    navigator.share?.({ title: item.name, url: location.href })
                  }
                >
                  <Share2 /> Share
                </button>
              </div>
              <section className="reviews">
                <h3>Customer Reviews</h3>
                {reviews
                  .filter((r) => r.product_id === item.id)
                  .map((r) => (
                    <article key={r.id}>
                      <div className="stars">
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </div>
                      <b>{r.title}</b>
                      <p>{r.body}</p>
                      <small>
                        {r.reviewer_name} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </small>
                    </article>
                  ))}
                {!ratingFor(item.id).count && (
                  <p>No reviews yet. Be the first to share your experience.</p>
                )}
                <div className="review-form">
                  <h4>Write a Review</h4>
                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        aria-label={`${n} stars`}
                      >
                        <Star fill={n <= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <input
                    placeholder="Review title"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Tell customers about your experience"
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                  />
                  <button
                    disabled={reviewTitle.length < 2 || reviewBody.length < 5}
                    onClick={submitReview}
                  >
                    SUBMIT REVIEW
                  </button>
                  {reviewMsg && <small>{reviewMsg}</small>}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
