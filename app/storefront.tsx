"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountry, canUsePhonePe, INTERNATIONAL_PAYMENT_MESSAGE } from "./lib/global-commerce";
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
type ProductVariant = { id: string; product_id: string; label: string; price_inr: number; stock_quantity: number; is_active: boolean; sort_order: number };
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
  abhimantrit_available?: boolean;
  abhimantrit_selected?: boolean;
  certificate_available?: boolean;
  certificate_price_inr?: number;
  certificate_selected?: boolean;
  has_size_options?: boolean;
  custom_shipping_enabled?: boolean;
  custom_shipping_charge_inr?: number;
  variants?: ProductVariant[];
  variant_id?: string | null;
  variant_label?: string | null;
  created_at?: string;
};
type AstrologyService = { name: string; description: string; active: boolean };
const defaultAstrologyServices: AstrologyService[] = [
  { name: "Kundali Analysis", description: "A detailed interpretation of your birth chart, planetary placements, and key life areas.", active: true },
  { name: "Gemstone Consultation", description: "Personalised gemstone recommendations informed by your birth chart.", active: true },
];
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
  country_code: string;
  phone_country_code: string;
};
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
    "OPEN 24/7 (Including Sundays)  |  Free Shipping Pan India  |  Limited One-of-One Products",
  hero_title: "Divine Energy. Timeless Beauty.",
  hero_text:
    "Authentic gemstones, sacred jewellery, Rudraksha and spiritual products for prosperity, protection and peace.",
  hero_image_url: "/maa-lakshmi-hero-fast.webp",
  brand_logo_url: "",
  founder_image_url: "",
  founder_message:
    "At Shree Gauri, the things we wear and keep close can carry more than beauty. They can carry meaning, memories, tradition and a sense of connection. Every collection is selected with authenticity, thoughtful craftsmanship and transparent service at its heart.",
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
    [astrologyServices, setAstrologyServices] = useState<AstrologyService[]>(defaultAstrologyServices),
    [astrologySubmitting, setAstrologySubmitting] = useState(false),
    [astrologyMessage, setAstrologyMessage] = useState(""),
    [view, setView] = useState("home"),
    [q, setQ] = useState(""),
    [displayCurrency, setDisplayCurrency] = useState("INR"),
    [currencyRates, setCurrencyRates] = useState<Record<string, number>>({"INR":1,"USD":0.012,"EUR":0.01,"GBP":0.009,"AED":0.044,"CAD":0.016,"AUD":0.018,"SGD":0.015,"JPY":1.75,"CHF":0.0095,"NZD":0.02,"SAR":0.045,"QAR":0.044,"KWD":0.0037,"BHD":0.0045,"OMR":0.0046,"MYR":0.051,"THB":0.38,"IDR":190,"PHP":0.68,"VND":315,"ZAR":0.21,"MUR":0.55,"NPR":1.6,"LKR":3.65,"BDT":1.46,"KRW":16.5,"SEK":0.112,"NOK":0.118,"DKK":0.069,"PLN":0.043,"HKD":0.093}),
    [menu, setMenu] = useState(false),
    [item, setItem] = useState<P | null>(null),
    [selectedImage, setSelectedImage] = useState(""),
    [imageZoomOpen, setImageZoomOpen] = useState(false),
    [descriptionOpen, setDescriptionOpen] = useState(false),
    [qty, setQty] = useState(1),
    [abhimantritChoice, setAbhimantritChoice] = useState(false),
    [certificateChoice, setCertificateChoice] = useState(false),
    [catalogPage, setCatalogPage] = useState(1),
    [selectedVariantId, setSelectedVariantId] = useState(""),
    [cartNotice, setCartNotice] = useState(""),
    [cart, setCart] = useState<P[]>(() => {
      if (typeof window === "undefined") return [];
      try { return JSON.parse(localStorage.getItem("sg_cart") || "[]"); } catch { return []; }
    }),
    [wish, setWish] = useState<string[]>([]),
    [sort, setSort] = useState("featured"),
    [categoryFilter, setCategoryFilter] = useState("all"),
    [stockOnly, setStockOnly] = useState(false),
    [filtersOpen, setFiltersOpen] = useState(false),
    [rating, setRating] = useState(5),
    [reviewTitle, setReviewTitle] = useState(""),
    [reviewBody, setReviewBody] = useState(""),
    [reviewMsg, setReviewMsg] = useState(""),
    [checkoutOpen, setCheckoutOpen] = useState(false),
    [checkoutBusy, setCheckoutBusy] = useState(false),
    [checkoutMsg, setCheckoutMsg] = useState(""),
    [couponCode, setCouponCode] = useState(""),
    [availableCoupons, setAvailableCoupons] = useState<any[]>([]),
    [activeCoupon, setActiveCoupon] = useState<any>(null),
    [couponMessage, setCouponMessage] = useState(""),
    [shippingSettings, setShippingSettings] = useState<any>(null),
    [checkoutAddresses, setCheckoutAddresses] = useState<SavedAddress[]>([]),
    [selectedAddressId, setSelectedAddressId] = useState(""),
    [checkout, setCheckout] = useState<Checkout>({
      name: "",
      email: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country_code: DEFAULT_COUNTRY.code,
      phone_country_code: DEFAULT_COUNTRY.dialCode,
    });
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
          "id,category_id,category_ids,name,slug,short_description,description,price_inr,compare_at_price_inr,primary_image_url,image_urls,stock_quantity,is_featured,badge,certificate_available,certificate_price_inr,has_size_options,custom_shipping_enabled,custom_shipping_charge_inr,abhimantrit_available",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("id", 1).single(),
      supabase
        .from("product_reviews")
        .select("id,product_id,reviewer_name,rating,title,body,created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
    ]).then(async ([a, b, d, r]) => {
      if (a.data) setCats(a.data as C[]);
      if (b.data) {
        const productIds = b.data.map((p: any) => p.id);
        const { data: variantData } = productIds.length
          ? await supabase.from("product_variants").select("id,product_id,label,price_inr,stock_quantity,is_active,sort_order").in("product_id", productIds).eq("is_active", true).order("sort_order", { ascending: true })
          : { data: [] as any[] };
        const variantsByProduct = new Map<string, ProductVariant[]>();
        (variantData || []).forEach((variant: any) => {
          const list = variantsByProduct.get(variant.product_id) || [];
          list.push(variant as ProductVariant);
          variantsByProduct.set(variant.product_id, list);
        });
        setProducts(b.data.map((p: any) => ({
          ...p, variants: variantsByProduct.get(p.id) || [],
          image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
          category_ids: Array.isArray(p.category_ids) && p.category_ids.length ? p.category_ids : p.category_id ? [p.category_id] : [],
        })) as P[]);
      }
      if (d.data) {
        setS({ ...d.data, hero_image_url: "/maa-lakshmi-hero-fast.webp" } as S);
        if (Array.isArray((d.data as any).astrology_services)) setAstrologyServices((d.data as any).astrology_services);
      }
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

  function confirmAddedToCart(productName: string, quantity = 1) {
    setCartNotice(`${quantity} × ${productName} added to cart successfully.`);
    window.setTimeout(() => setCartNotice(""), 2800);
  }

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

    const [{ data: couponRows }, { data: shippingConfig }] = await Promise.all([
      supabase.from("promo_codes").select("code,discount_type,discount_value,min_order_inr,max_discount_inr,starts_at,ends_at").eq("is_active", true).eq("is_public", true).eq("show_on_dashboard", true).order("created_at", { ascending: false }),
      supabase.from("shipping_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setShippingSettings(shippingConfig || null);
    const now = Date.now();
    setAvailableCoupons((couponRows || []).filter((coupon: any) => (!coupon.starts_at || new Date(coupon.starts_at).getTime() <= now) && (!coupon.ends_at || new Date(coupon.ends_at).getTime() >= now)));

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
      country_code: DEFAULT_COUNTRY.code,
      phone_country_code: DEFAULT_COUNTRY.dialCode,
    });
    setCheckoutMsg(addresses.length ? "" : "Add a delivery address here or save one in My Account.");
    setCheckoutOpen(true);
  }

  async function applyCoupon(rawCode = couponCode) {
    const code = String(rawCode || "").trim().toUpperCase();
    if (!code) { setActiveCoupon(null); setCouponMessage("Enter a coupon code first."); return; }
    const { data: coupon, error } = await supabase.from("promo_codes").select("*").eq("code", code).eq("is_active", true).maybeSingle();
    if (error || !coupon) { setActiveCoupon(null); setCouponMessage("This coupon is invalid or inactive."); return; }
    const now = Date.now();
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) { setActiveCoupon(null); setCouponMessage("This coupon is not active yet."); return; }
    if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) { setActiveCoupon(null); setCouponMessage("This coupon has expired."); return; }
    if (cartSubtotal < Number(coupon.min_order_inr || 0)) { setActiveCoupon(null); setCouponMessage(`Minimum order for this coupon is ₹${Number(coupon.min_order_inr).toLocaleString("en-IN")}.`); return; }
    if (coupon.applies_to === "products" && !cart.every((product) => (coupon.product_ids || []).includes(product.id))) { setActiveCoupon(null); setCouponMessage("This coupon applies only to its selected products. Remove other products to use it."); return; }
    if (coupon.applies_to === "categories" && !cart.every((product) => [...(product.category_ids || []), ...(product.category_id ? [product.category_id] : [])].some((id) => (coupon.category_ids || []).includes(id)))) { setActiveCoupon(null); setCouponMessage("This coupon applies only to its selected categories. Remove other products to use it."); return; }
    setCouponCode(code); setActiveCoupon(coupon); setCouponMessage("Coupon applied. Final eligibility is checked securely at payment.");
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
      country_code: DEFAULT_COUNTRY.code,
      phone_country_code: DEFAULT_COUNTRY.dialCode,
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

  const money = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: displayCurrency, maximumFractionDigits: displayCurrency === "INR" ? 0 : 2 }).format(n * (currencyRates[displayCurrency] || 1));
  useEffect(() => {
    const savedCurrency=localStorage.getItem("sg_currency");
    if(savedCurrency && ["INR","USD","EUR","GBP","AED","CAD","AUD","SGD","JPY","CHF","NZD","SAR","QAR","KWD","BHD","OMR","MYR","THB","IDR","PHP","VND","ZAR","MUR","NPR","LKR","BDT","KRW","SEK","NOK","DKK","PLN","HKD"].includes(savedCurrency)) setDisplayCurrency(savedCurrency);
    supabase.from("site_settings").select("currency_rates").eq("id",1).single().then(({data})=>{if((data as any)?.currency_rates)setCurrencyRates({...{"INR":1,"USD":0.012,"EUR":0.01,"GBP":0.009,"AED":0.044,"CAD":0.016,"AUD":0.018,"SGD":0.015,"JPY":1.75,"CHF":0.0095,"NZD":0.02,"SAR":0.045,"QAR":0.044,"KWD":0.0037,"BHD":0.0045,"OMR":0.0046,"MYR":0.051,"THB":0.38,"IDR":190,"PHP":0.68,"VND":315,"ZAR":0.21,"MUR":0.55,"NPR":1.6,"LKR":3.65,"BDT":1.46,"KRW":16.5,"SEK":0.112,"NOK":0.118,"DKK":0.069,"PLN":0.043,"HKD":0.093},...(data as any).currency_rates})});
  }, []);
  useEffect(() => { localStorage.setItem("sg_currency",displayCurrency); }, [displayCurrency]);
  const go = (v: string) => {
    setView(v);
    setCatalogPage(1);
    setMenu(false);
    setItem(null);
    setTimeout(
      () =>
        window.scrollTo({ top: v === "home" ? 0 : 560, behavior: "smooth" }),
      20,
    );
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
    if (!canUsePhonePe(checkout.country_code)) {
      setCheckoutMsg(INTERNATIONAL_PAYMENT_MESSAGE);
      return;
    }
    setCheckoutBusy(true);
    setCheckoutMsg("Opening secure payment...");
    const grouped = Object.values(
      cart.reduce(
        (a, p) => {
          const key = `${p.id}:${p.variant_id || "base"}:${p.abhimantrit_selected ? "yes" : "no"}:${p.certificate_selected ? "cert" : "nocert"}`;
          a[key] ??= { product_id: p.id, variant_id: p.variant_id || null, variant_label: p.variant_label || null, quantity: 0, abhimantrit_selected: !!p.abhimantrit_selected, certificate_selected: !!p.certificate_selected };
          a[key].quantity++;
          return a;
        },
        {} as Record<string, { product_id: string; variant_id: string | null; variant_label: string | null; quantity: number; abhimantrit_selected: boolean; certificate_selected: boolean }>,
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
      },
      items: grouped,
      promo_code: couponCode.trim().toUpperCase(),
    };
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
        (categoryFilter === "all" || p.category_id === categoryFilter) &&
        (!stockOnly || p.stock_quantity > 0 || (p.variants || []).some((variant) => variant.stock_quantity > 0))
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
              : sort === "newest"
                ? new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                : 0,
    );
  }, [products, q, view, cats, categoryFilter, stockOnly, sort]);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const pageProducts = shown.slice((catalogPage - 1) * pageSize, catalogPage * pageSize);
  const selectedVariant = item?.variants?.find((variant) => variant.id === selectedVariantId) || item?.variants?.[0] || null;
  const displayedItemPrice = selectedVariant ? Number(selectedVariant.price_inr) : Number(item?.price_inr || 0);
  const displayedItemStock = selectedVariant ? Number(selectedVariant.stock_quantity) : Number(item?.stock_quantity || 0);
  const cartSubtotal = cart.reduce((sum, product) => sum + Number(product.price_inr || 0), 0);
  const certificateEstimate = cart.reduce((sum, product) => sum + (product.certificate_selected ? Number(product.certificate_price_inr || 0) : 0), 0);
  const customShippingEstimate = cart.reduce((sum, product) => sum + (product.custom_shipping_enabled ? Number(product.custom_shipping_charge_inr || 0) : 0), 0);
  const needsDefaultShipping = cart.some((product) => !product.custom_shipping_enabled);
  const defaultShippingEstimate = needsDefaultShipping ? Number(shippingSettings?.default_shipping_charge_inr || 0) : 0;
  const freeShippingEstimate = Boolean(shippingSettings?.free_shipping_enabled && Number(shippingSettings?.free_shipping_threshold_inr || 0) > 0 && cartSubtotal >= Number(shippingSettings.free_shipping_threshold_inr));
  const shippingEstimate = freeShippingEstimate ? 0 : customShippingEstimate + defaultShippingEstimate;
  const couponDiscountEstimate = activeCoupon && cartSubtotal >= Number(activeCoupon.min_order_inr || 0)
    ? Math.min(activeCoupon.discount_type === "percentage" ? cartSubtotal * Number(activeCoupon.discount_value) / 100 : Number(activeCoupon.discount_value), (activeCoupon.max_discount_inr == null ? Number.POSITIVE_INFINITY : Number(activeCoupon.max_discount_inr)), cartSubtotal)
    : 0;
  const checkoutTotalEstimate = Math.max(0, cartSubtotal + certificateEstimate + shippingEstimate - couponDiscountEstimate);
  useEffect(() => { setCatalogPage(1); }, [q, view, categoryFilter, stockOnly, sort]);
  useEffect(() => { if (catalogPage > pageCount) setCatalogPage(pageCount); }, [catalogPage, pageCount]);
  const nav = [
    ["home", "Home"],
    ["shop", "Categories"],
    ["new", "New Arrivals"],
    ["best", "Best Sellers"],
    ["astrology", "Astrology"],
    ["about", "About Us"],
    ["contact", "Contact Us"],
  ];
  return (
    <main>
      {cartNotice && (
        <div className="sg-cart-toast" role="status" aria-live="polite">
          <span>✓</span>
          <div><b>Added to cart</b><small>{cartNotice}</small></div>
          <button type="button" onClick={() => { setCartNotice(""); go("cart"); }}>VIEW CART</button>
        </div>
      )}
      <div className="topbar">
        <span>{s.announcement}</span>
        <span>
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
          <label className="header-currency" title="Display currency"><span>Currency</span><select aria-label="Select display currency" value={displayCurrency} onChange={(e)=>setDisplayCurrency(e.target.value)}>{["INR","USD","EUR","GBP","AED","CAD","AUD","SGD","JPY","CHF","NZD","SAR","QAR","KWD","BHD","OMR","MYR","THB","IDR","PHP","VND","ZAR","MUR","NPR","LKR","BDT","KRW","SEK","NOK","DKK","PLN","HKD"].map((code)=><option key={code} value={code}>{code}</option>)}</select></label>
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
              <b>100% Authentic</b>
              <small>Carefully selected</small>
            </div>
            <div>
              <Gem />
              <b>Premium Quality</b>
              <small>Genuine craftsmanship</small>
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
      {view === "astrology" && (
        <section className="section" style={{padding:"clamp(28px,6vw,76px) 20px",background:"#fbf7ef",color:"#332a27"}}>
          <div style={{maxWidth:1040,margin:"0 auto",border:"1px solid #d8c8a8",borderRadius:18,padding:"clamp(22px,5vw,54px)",textAlign:"center",background:"#fffdf8",boxShadow:"0 18px 50px rgba(67,44,31,.08)"}}>
            <div style={{fontSize:12,letterSpacing:".2em",color:"#7b1420",fontWeight:800}}>SHREE GAURI · ASTROLOGY SERVICES</div>
            <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(30px,5vw,52px)",lineHeight:1.12,margin:"16px auto",maxWidth:760,color:"#4a2927"}}>Personalized Vedic Astrology Consultation</h1>
            <p style={{maxWidth:650,margin:"0 auto 30px",fontSize:16,lineHeight:1.8,color:"#403632",fontWeight:500}}>Professional consultations for birth-chart analysis and personalised gemstone recommendations.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,270px),1fr))",gap:16,textAlign:"left",margin:"0 auto 34px",maxWidth:900}}>
              {astrologyServices.filter(service=>service.active).map((service,index)=>(
                <article key={service.name} style={{border:"1px solid #cdb88f",borderRadius:12,padding:24,background:"#ffffff",color:"#241716",boxShadow:"0 6px 18px rgba(55,28,20,.06)"}}>
                  <div style={{color:"#7b1420",fontSize:12,letterSpacing:".12em",fontWeight:800}}>{String(index+1).padStart(2,"0")} · SHREE GAURI SERVICE</div>
                  <h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"12px 0",color:"#4a2927"}}>{service.name}</h2>
                  <p style={{color:"#403632",lineHeight:1.8,margin:0,fontWeight:500}}>{service.description}</p>
                </article>
              ))}
            </div>
            <div style={{maxWidth:700,margin:"0 auto",textAlign:"left",padding:"clamp(20px,4vw,32px)",border:"1px solid #e3d7c4",borderRadius:14,background:"#ffffff"}}>
              <h2 style={{fontFamily:"Georgia,serif",fontSize:27,color:"#4a2927",margin:"0 0 8px"}}>Request a consultation</h2>
              <p style={{color:"#6b5d54",lineHeight:1.6,margin:"0 0 22px"}}>Share your details and our team will contact you directly.</p>
              <form onSubmit={async(e)=>{e.preventDefault();if(astrologySubmitting)return;const form=e.currentTarget;setAstrologySubmitting(true);setAstrologyMessage("Submitting your enquiry…");const f=new FormData(form);const response=await fetch("/api/astrology/enquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:String(f.get("name")||""),mobile:String(f.get("phone")||""),email:String(f.get("email")||""),address:String(f.get("address")||""),service:String(f.get("service")||""),preferred_time:String(f.get("when")||""),details:String(f.get("details")||""),website:String(f.get("website")||"")})});const data=await response.json().catch(()=>({}));setAstrologySubmitting(false);if(!response.ok||!data?.ok){setAstrologyMessage(data?.error||"Unable to submit right now. Please try again.");return;}setAstrologyMessage(data.message||"Your enquiry has been received. Our team will contact you.");form.reset();}} style={{display:"grid",gap:14}}>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Full name<input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Mobile number<input name="phone" required type="tel" minLength={7} maxLength={25} autoComplete="tel" placeholder="Your contact number" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Email address<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Full address<textarea name="address" required minLength={5} maxLength={500} rows={2} autoComplete="street-address" placeholder="House / street, city, state, PIN code" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400,resize:"vertical"}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Consultation type<select name="service" required defaultValue="" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,background:"#fff",font:"inherit"}}><option value="" disabled>Select a service</option>{astrologyServices.filter(service=>service.active).map(service=><option key={service.name} value={service.name}>{service.name}</option>)}{astrologyServices.filter(service=>service.active).length>1&&<option value="Both consultations">Both consultations</option>}</select></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Preferred date / time (optional)<input name="when" maxLength={160} placeholder="Your preferred time" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Additional details (optional)<textarea name="details" rows={4} maxLength={2000} placeholder="Briefly share your questions or details" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400,resize:"vertical"}}/></label>
                <label style={{position:"absolute",left:"-10000px"}} aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
                <button type="submit" disabled={astrologySubmitting} style={{padding:"15px 22px",border:0,borderRadius:8,background:"#7b1420",color:"#fffdf8",fontWeight:800,fontSize:15,cursor:astrologySubmitting?"wait":"pointer",opacity:astrologySubmitting ? 0.7 : 1}}>{astrologySubmitting?"Submitting…":"Submit enquiry"}</button>
                {astrologyMessage&&<p role="status" aria-live="polite" style={{margin:0,color:"#403632",lineHeight:1.6,fontWeight:600}}>{astrologyMessage}</p>}
                <small style={{color:"#75675e",lineHeight:1.5}}>Your enquiry is securely recorded for our team. We will contact you using the details provided.</small>
              </form>
            </div>
          </div>
        </section>
      )}
      {view === "home" && (
        <section className="section" style={{margin:"32px auto",maxWidth:1120,padding:"clamp(26px,4vw,48px)",background:"linear-gradient(135deg,#fffdf8 0%,#fbf1df 100%)",color:"#321316",textAlign:"center",border:"1px solid #d8bd8c",borderRadius:16,boxShadow:"0 12px 34px rgba(67,35,22,.08)"}}>
          <small style={{display:"block",letterSpacing:".16em",color:"#7b1420",fontWeight:800,fontSize:12}}>PERSONALIZED VEDIC CONSULTATION</small>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(25px,4.2vw,42px)",fontWeight:700,lineHeight:1.2,margin:"14px auto",maxWidth:780,padding:"0 8px",textWrap:"balance",overflowWrap:"anywhere",color:"#401016",textShadow:"none"}}>Kundali Analysis &amp; Gemstone Consultation</h2>
          <p style={{maxWidth:640,margin:"0 auto 24px",lineHeight:1.75,fontSize:"clamp(15px,2vw,17px)",fontWeight:500,color:"#493936"}}>Choose a detailed birth-chart analysis or a personalised gemstone consultation.</p>
          <button onClick={() => go("astrology")} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 25px",background:"#741923",color:"#ffffff",border:"1px solid #741923",borderRadius:7,fontWeight:800,letterSpacing:".04em",cursor:"pointer"}}>VIEW CONSULTATION OPTIONS <ChevronRight size={16} /></button>
        </section>
      )}

      {view === "astrology" && (
        <section className="section" style={{padding:"clamp(28px,6vw,76px) 20px",background:"#fbf7ef",color:"#332a27"}}>
          <div style={{maxWidth:1040,margin:"0 auto",border:"1px solid #d8c8a8",borderRadius:18,padding:"clamp(22px,5vw,54px)",textAlign:"center",background:"#fffdf8",boxShadow:"0 18px 50px rgba(67,44,31,.08)"}}>
            <div style={{fontSize:12,letterSpacing:".2em",color:"#7b1420",fontWeight:800}}>SHREE GAURI · ASTROLOGY SERVICES</div>
            <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(30px,5vw,52px)",lineHeight:1.12,margin:"16px auto",maxWidth:760,color:"#4a2927"}}>Personalized Vedic Astrology Consultation</h1>
            <p style={{maxWidth:650,margin:"0 auto 30px",fontSize:16,lineHeight:1.8,color:"#403632",fontWeight:500}}>Professional consultations for birth-chart analysis and personalised gemstone recommendations.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,270px),1fr))",gap:16,textAlign:"left",margin:"0 auto 34px",maxWidth:900}}>
              {astrologyServices.filter(service=>service.active).map((service,index)=>(
                <article key={service.name} style={{border:"1px solid #cdb88f",borderRadius:12,padding:24,background:"#ffffff",color:"#241716",boxShadow:"0 6px 18px rgba(55,28,20,.06)"}}>
                  <div style={{color:"#7b1420",fontSize:12,letterSpacing:".12em",fontWeight:800}}>{String(index+1).padStart(2,"0")} · SHREE GAURI SERVICE</div>
                  <h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"12px 0",color:"#4a2927"}}>{service.name}</h2>
                  <p style={{color:"#403632",lineHeight:1.8,margin:0,fontWeight:500}}>{service.description}</p>
                </article>
              ))}
            </div>
            <div style={{maxWidth:700,margin:"0 auto",textAlign:"left",padding:"clamp(20px,4vw,32px)",border:"1px solid #e3d7c4",borderRadius:14,background:"#ffffff"}}>
              <h2 style={{fontFamily:"Georgia,serif",fontSize:27,color:"#4a2927",margin:"0 0 8px"}}>Request a consultation</h2>
              <p style={{color:"#6b5d54",lineHeight:1.6,margin:"0 0 22px"}}>Share your details and our team will contact you directly.</p>
              <form onSubmit={async(e)=>{e.preventDefault();if(astrologySubmitting)return;const form=e.currentTarget;setAstrologySubmitting(true);setAstrologyMessage("Submitting your enquiry…");const f=new FormData(form);const response=await fetch("/api/astrology/enquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:String(f.get("name")||""),mobile:String(f.get("phone")||""),email:String(f.get("email")||""),address:String(f.get("address")||""),service:String(f.get("service")||""),preferred_time:String(f.get("when")||""),details:String(f.get("details")||""),website:String(f.get("website")||"")})});const data=await response.json().catch(()=>({}));setAstrologySubmitting(false);if(!response.ok||!data?.ok){setAstrologyMessage(data?.error||"Unable to submit right now. Please try again.");return;}setAstrologyMessage(data.message||"Your enquiry has been received. Our team will contact you.");form.reset();}} style={{display:"grid",gap:14}}>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Full name<input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Mobile number<input name="phone" required type="tel" minLength={7} maxLength={25} autoComplete="tel" placeholder="Your contact number" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Email address<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Full address<textarea name="address" required minLength={5} maxLength={500} rows={2} autoComplete="street-address" placeholder="House / street, city, state, PIN code" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400,resize:"vertical"}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Consultation type<select name="service" required defaultValue="" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,background:"#fff",font:"inherit"}}><option value="" disabled>Select a service</option>{astrologyServices.filter(service=>service.active).map(service=><option key={service.name} value={service.name}>{service.name}</option>)}{astrologyServices.filter(service=>service.active).length>1&&<option value="Both consultations">Both consultations</option>}</select></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Preferred date / time (optional)<input name="when" maxLength={160} placeholder="Your preferred time" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400}}/></label>
                <label style={{display:"grid",gap:6,fontSize:14,fontWeight:700,color:"#4a2927"}}>Additional details (optional)<textarea name="details" rows={4} maxLength={2000} placeholder="Briefly share your questions or details" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d7cbbb",borderRadius:8,font:"inherit",fontWeight:400,resize:"vertical"}}/></label>
                <label style={{position:"absolute",left:"-10000px"}} aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
                <button type="submit" disabled={astrologySubmitting} style={{padding:"15px 22px",border:0,borderRadius:8,background:"#7b1420",color:"#fffdf8",fontWeight:800,fontSize:15,cursor:astrologySubmitting?"wait":"pointer",opacity:astrologySubmitting ? 0.7 : 1}}>{astrologySubmitting?"Submitting…":"Submit enquiry"}</button>
                {astrologyMessage&&<p role="status" aria-live="polite" style={{margin:0,color:"#403632",lineHeight:1.6,fontWeight:600}}>{astrologyMessage}</p>}
                <small style={{color:"#75675e",lineHeight:1.5}}>Your enquiry is securely recorded for our team. We will contact you using the details provided.</small>
              </form>
            </div>
          </div>
        </section>
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
                        <img src={fastImage(c.image_url, 180, 66)} alt={c.name} loading="eager" fetchPriority="high" decoding="async" width={180} height={180} />
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
                        <img src={fastImage(c.image_url, 180, 66)} alt={c.name} loading="eager" fetchPriority="high" decoding="async" width={180} height={180} />
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
                        <img src={fastImage(c.image_url, 180, 66)} alt={c.name} loading="eager" fetchPriority="high" decoding="async" width={180} height={180} />
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
        <section className="section cream catalog">
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
            <button
              className="filter-toggle"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal /> FILTER{(categoryFilter !== "all" || stockOnly) ? <em className="filter-count">{Number(categoryFilter !== "all") + Number(stockOnly)}</em> : null}
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
                  .filter((c) => c.collection_type === "category" && !c.parent_id)
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
                  setQ("");
                }}
              >
                CLEAR ALL
              </button>
              <button className="apply-filters" onClick={() => setFiltersOpen(false)}>SHOW {shown.length} PRODUCTS</button>
            </aside>
            {filtersOpen && <button aria-label="Close filters" className="filter-backdrop" onClick={() => setFiltersOpen(false)} />}
            <div className="product-grid">
              {shown.length ? (
                pageProducts.map((p) => (
                  <article
                    key={p.id}
                    className="product-card-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest(".heart, .product-actions")) return;
                      setSelectedImage(p.primary_image_url || p.image_urls?.[0] || "");
                      setItem(p); setSelectedVariantId(p.variants?.[0]?.id || ""); setQty(1); setAbhimantritChoice(false); setCertificateChoice(false);
                      setDescriptionOpen(false);
                      setQty(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedImage(p.primary_image_url || p.image_urls?.[0] || "");
                        setItem(p); setSelectedVariantId(p.variants?.[0]?.id || ""); setQty(1); setAbhimantritChoice(false); setCertificateChoice(false);
                        setDescriptionOpen(false);
                        setQty(1);
                      }
                    }}
                  >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(p.primary_image_url || p.image_urls?.[0] || "");
                        setItem(p); setSelectedVariantId(p.variants?.[0]?.id || ""); setQty(1); setAbhimantritChoice(false); setCertificateChoice(false);
                        setDescriptionOpen(false);
                        setQty(1);
                      }}
                    >
                      <img
                        src={
                          p.primary_image_url
                            ? fastImage(p.primary_image_url, 420, 68)
                            : p.image_urls?.[0]
                              ? fastImage(p.image_urls[0], 420, 68)
                              : "/shree-gauri-logo.png"
                        }
                        alt={p.name}
                        loading={shown.indexOf(p) < 8 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={shown.indexOf(p) < 4 ? "high" : "auto"}
                        width={420}
                        height={420}
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
                      <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => {
                          if (p.certificate_available || p.abhimantrit_available || p.has_size_options || p.variants?.length) { setItem(p); setSelectedVariantId(p.variants?.[0]?.id || ""); setQty(1); setCertificateChoice(false); setAbhimantritChoice(false); return; }
                          setCart((c) => [...c, p]); confirmAddedToCart(p.name);
                        }}>
                          ADD TO CART
                        </button>
                        <button
                          className="buy-now-site"
                          onClick={() => { if (p.certificate_available || p.abhimantrit_available || p.has_size_options || p.variants?.length) { setItem(p); setSelectedVariantId(p.variants?.[0]?.id || ""); setQty(1); setCertificateChoice(false); setAbhimantritChoice(false); return; } setCart([p]); setItem(null); window.setTimeout(() => openSecureCheckout(), 0); }}
                        >
                          BUY NOW
                        </button>
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
            {shown.length > pageSize && (
              <nav className="catalog-pagination" aria-label="Product pages">
                <button type="button" disabled={catalogPage <= 1} onClick={() => { setCatalogPage((n) => Math.max(1, n - 1)); document.querySelector(".catalog-toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Previous</button>
                <div className="catalog-page-numbers" style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button key={page} type="button" aria-current={catalogPage === page ? "page" : undefined} className={catalogPage === page ? "active" : ""} onClick={() => { setCatalogPage(page); document.querySelector(".catalog-toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{page}</button>)}
                </div>
                <span>Page {catalogPage} of {pageCount}</span>
                <button type="button" disabled={catalogPage >= pageCount} onClick={() => { setCatalogPage((n) => Math.min(pageCount, n + 1)); document.querySelector(".catalog-toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Next</button>
              </nav>
            )}
          </div>
        </section>
      )}
      {view === "about" && (
        <section className="simple">
          <small className="kicker">OUR STORY</small>
          <h1>Rooted in devotion. Chosen with care.</h1>
          <p>
            Shree Gauri brings together authentic gemstones, jewellery and
            spiritual essentials in one trusted destination. Meaningful products
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
              {p.variant_label && <small>Selected option: {p.variant_label}</small>}
              {p.abhimantrit_selected && <small>Abhimantrit / Energisation: Yes</small>}
              {p.certificate_selected && <small>Authenticity certificate: Yes</small>}
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
        </div>
        <div>
          <b>Explore</b>
          {cats
            .filter((c) => c.collection_type === "category" && !c.parent_id)
            .slice(0, 6)
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
          <a href="/astrology">Astrology Consultation</a>
          <a href="/login">Customer Login</a>
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
              Select a saved delivery address or enter another address. India orders can complete payment securely through PhonePe. International customers can enter their delivery details and contact Shree Gauri for shipping and payment assistance.
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
              <label>Country<select value={checkout.country_code} onChange={(e) => { const country=getCountry(e.target.value); setCheckout((c)=>({...c,country_code:country.code,phone_country_code:country.dialCode})); }}>{COUNTRY_OPTIONS.map((country)=><option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
              <label>Phone code<select value={checkout.phone_country_code} onChange={(e)=>setCheckout((c)=>({...c,phone_country_code:e.target.value}))}>{COUNTRY_OPTIONS.map((country)=><option key={country.code} value={country.dialCode}>{country.name} ({country.dialCode})</option>)}</select></label>
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
                State
                <input
                  required
                  value={checkout.state}
                  onChange={(e) =>
                    setCheckout({ ...checkout, state: e.target.value })
                  }
                />
              </label>
              <label>
                PIN Code
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={checkout.pincode}
                  onChange={(e) =>
                    setCheckout({ ...checkout, pincode: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="checkout-nav-actions">
              <button type="button" onClick={() => { setCheckoutOpen(false); go("cart"); }}>GO TO CART</button>
              <a href="/login?section=overview">MY DASHBOARD</a>
            </div>
            <div className="checkout-products">
              <div className="checkout-products-head"><b>Order Items</b><span>{cart.length} item(s)</span></div>
              {cart.map((p, i) => (
                <div className="checkout-product-row" key={`${p.id}-${i}`}>
                  <img src={p.primary_image_url || p.image_urls?.[0] || "/shree-gauri-logo.png"} alt={p.name} />
                  <div><b>{p.name}</b>{p.variant_label && <small>Option: {p.variant_label}</small>}{p.abhimantrit_selected && <small>Abhimantrit / Energisation: Yes</small>}{p.certificate_selected && <small>Authenticity certificate: Yes</small>}<small>{money(Number(p.price_inr))}</small></div>
                  <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setCart((items) => items.filter((_, index) => index !== i))}><X /> REMOVE</button>
                </div>
              ))}
            </div>
            <div className="checkout-coupon" style={{ margin: "14px 0", padding: 14, border: "1px solid #e5d7c9", borderRadius: 10 }}>
              <b>Apply a discount coupon</b>
              {availableCoupons.length > 0 && <div style={{ margin: "8px 0", display: "grid", gap: 6 }}>{availableCoupons.map((c:any) => <button type="button" key={c.code} onClick={() => { setCouponCode(c.code); void applyCoupon(c.code); }} style={{ textAlign: "left", padding: 8, border: "1px solid #e5d7c9", borderRadius: 7, background: "#fffdf9" }}>{c.code} · {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`} · Min. ₹{Number(c.min_order_inr || 0).toLocaleString("en-IN")}</button>)}</div>}
              <input aria-label="Coupon code" placeholder="Enter a coupon code" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setActiveCoupon(null); setCouponMessage(""); }} />
              <button type="button" onClick={() => void applyCoupon()}>APPLY COUPON</button>
              <small>Private coupon codes can also be entered here. {couponMessage}</small>
            </div>
            <div className="checkout-summary" style={{ display: "grid", gap: 8, padding: 14, border: "1px solid #e5d7c9", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal · {cart.length} item(s)</span><b>{money(cartSubtotal)}</b></div>
              {certificateEstimate > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Authenticity certificates</span><b>{money(certificateEstimate)}</b></div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Shipping {freeShippingEstimate ? "(Free)" : "(Estimated)"}</span><b>{shippingEstimate ? money(shippingEstimate) : "₹0"}</b></div>
              {couponDiscountEstimate > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Coupon · {activeCoupon.code}</span><b>−{money(couponDiscountEstimate)}</b></div>}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5d7c9", paddingTop: 10, fontSize: 17 }}><strong>Estimated total</strong><strong>{money(checkoutTotalEstimate)}</strong></div>
              <small>Final shipping and coupon eligibility are verified by the server before payment.</small>
            </div>
            <button className="place-order" disabled={checkoutBusy}>
              {checkoutBusy
                ? "STARTING PAYMENT..."
                : "PROCEED TO SECURE PAYMENT"}
            </button>
            {checkoutMsg && <p className="checkout-message">{checkoutMsg}</p>}
          </form>
        </div>
      )}
      {imageZoomOpen && item && (
        <div className="image-zoom-modal" onClick={() => setImageZoomOpen(false)}>
          <button aria-label="Close image viewer" onClick={() => setImageZoomOpen(false)}><X /></button>
          <img src={selectedImage || item.primary_image_url || item.image_urls?.[0] || "/shree-gauri-logo.png"} alt={item.name} onClick={(e) => e.stopPropagation()} />
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
            <div className="product-gallery amazon-gallery">
              <div className="gallery-thumbs" aria-label="Product images">
                {[...new Set([item.primary_image_url, ...(item.image_urls || [])].filter(Boolean))]
                  .map((url, i) => (
                    <button
                      key={url}
                      aria-label={`View product image ${i + 1}`}
                      className={(selectedImage || item.primary_image_url || item.image_urls?.[0]) === url ? "active" : ""}
                      onClick={() => setSelectedImage(url)}
                      onMouseEnter={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`${item.name} view ${i + 1}`} loading="lazy" decoding="async" />
                    </button>
                  ))}
              </div>
              <div className="gallery-stage">
                {(() => {
                  const images = [...new Set([item.primary_image_url, ...(item.image_urls || [])].filter(Boolean))];
                  const active = selectedImage || images[0] || "/shree-gauri-logo.png";
                  const index = Math.max(0, images.indexOf(active));
                  const move = (step: number) => {
                    if (!images.length) return;
                    setSelectedImage(images[(index + step + images.length) % images.length]);
                  };
                  return <>
                    <button className="gallery-arrow gallery-prev" aria-label="Previous image" onClick={() => move(-1)}>‹</button>
                    <button className="gallery-zoom-trigger" aria-label="Open full size product image" onClick={() => setImageZoomOpen(true)}>
                      <img className="gallery-main" src={active} alt={item.name} decoding="async" />
                    </button>
                    <button className="gallery-arrow gallery-next" aria-label="Next image" onClick={() => move(1)}>›</button>
                    <span className="gallery-counter">{images.length ? index + 1 : 1} / {Math.max(images.length, 1)}</span>
                    <small>Tap image to zoom • Swipe thumbnails to browse</small>
                  </>;
                })()}
              </div>
            </div>
            <div className="product-copy">
              <small className="kicker">AUTHENTIC • CAREFULLY SELECTED</small>
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
              <div className="product-short-description">
                <b>About this item</b>
                <p>{item.short_description || item.description}</p>
              </div>
              {item.description && item.description !== item.short_description && (
                <div className={`product-full-description ${descriptionOpen ? "open" : ""}`}>
                  <div className="description-text">{item.description}</div>
                  <button type="button" onClick={() => setDescriptionOpen((v) => !v)}>
                    {descriptionOpen ? "SHOW LESS" : "LOAD MORE"}
                  </button>
                </div>
              )}
              {item.variants && item.variants.length > 0 && <label className="product-variant-picker" style={{ display: "grid", gap: 7, margin: "14px 0" }}>
                <b>Select size / weight</b>
                <select value={selectedVariant?.id || ""} onChange={(e) => setSelectedVariantId(e.target.value)} style={{ padding: 12, border: "1px solid #d8c8a8", borderRadius: 8, background: "#fff" }}>
                  {item.variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.stock_quantity <= 0}>{variant.label} — {money(Number(variant.price_inr))}{variant.stock_quantity <= 0 ? " · Out of stock" : ""}</option>)}
                </select>
              </label>}
              {item.has_size_options && !item.variants?.length && <p role="status" style={{ color: "#8b1e25" }}>Size / weight options are temporarily unavailable. Please contact Shree Gauri before ordering.</p>}
              <div className="product-price-block">
                <small>Price</small>
                <h3>{money(displayedItemPrice)}</h3>
                {item.compare_at_price_inr && <del>{money(Number(item.compare_at_price_inr))}</del>}
                <span>Inclusive of all taxes</span>
              </div>
              <span className={displayedItemStock > 0 ? "in-stock" : "out-stock"}>
                {displayedItemStock > 0 ? `In stock · Only ${displayedItemStock} available` : "Currently unavailable"}
              </span>
              <div className="purchase-promises">
                <span>
                  <ShieldCheck />
                  Authentic products
                </span>
                <span>
                  <PackageCheck />
                  Secure packaging
                </span>
              </div>
              {item.certificate_available && (
                <div style={{ margin: "16px 0", padding: 14, border: "1px solid #e5d7c9", borderRadius: 10 }}>
                  <b>Product Authenticity Certificate</b>
                  <p style={{ margin: "6px 0 10px", fontSize: 13 }}>Would you like to add an authenticity certificate for this product? Additional charge: {money(Number(item.certificate_price_inr || 0))}.</p>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 18 }}><input type="radio" name="certificate-choice" checked={!certificateChoice} onChange={() => setCertificateChoice(false)} /> No certificate</label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><input type="radio" name="certificate-choice" checked={certificateChoice} onChange={() => setCertificateChoice(true)} /> Yes, add certificate</label>
                </div>
              )}
              {item.abhimantrit_available && (
                <div className="product-service-choice" style={{ margin: "18px 0", padding: 14, border: "1px solid #e5d7c9", borderRadius: 10 }}>
                  <b>Abhimantrit / Energisation</b>
                  <p style={{ margin: "6px 0 10px", fontSize: 13 }}>Would you like Shree Gauri to perform the Abhimantrit energisation of this product before dispatch?</p>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 18 }}><input type="radio" name="abhimantrit-choice" checked={!abhimantritChoice} onChange={() => setAbhimantritChoice(false)} /> No, thank you</label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><input type="radio" name="abhimantrit-choice" checked={abhimantritChoice} onChange={() => setAbhimantritChoice(true)} /> Yes, please</label>
                </div>
              )}
              {item.abhimantrit_available && (
                <div style={{ margin: "16px 0", padding: 14, border: "1px solid #e5d7c9", borderRadius: 10 }}>
                  <b>Abhimantrit / Energisation</b>
                  <p style={{ margin: "6px 0 10px", fontSize: 13 }}>Would you like Shree Gauri to perform Abhimantrit energisation before dispatch?</p>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 18 }}><input type="radio" name="abhimantrit-choice" checked={!abhimantritChoice} onChange={() => setAbhimantritChoice(false)} /> No, thank you</label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><input type="radio" name="abhimantrit-choice" checked={abhimantritChoice} onChange={() => setAbhimantritChoice(true)} /> Yes, please</label>
                </div>
              )}
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
                  disabled={displayedItemStock <= 0 || (item.has_size_options && !selectedVariant)}
                  onClick={() => {
                    if (qty > displayedItemStock) { setCheckoutMsg(`Only ${displayedItemStock} available for this option.`); return; }
                    setCart((c) => [...c, ...Array.from({ length: qty }, () => ({ ...item, price_inr: displayedItemPrice, stock_quantity: displayedItemStock, variant_id: selectedVariant?.id || null, variant_label: selectedVariant?.label || null, abhimantrit_selected: !!(item.abhimantrit_available && abhimantritChoice), certificate_selected: !!(item.certificate_available && certificateChoice) }))]);
                    confirmAddedToCart(item.name, qty);
                    setItem(null);
                  }}
                >
                  ADD TO CART
                </button>
                <button
                  className="buy-now-site"
                  disabled={displayedItemStock <= 0 || (item.has_size_options && !selectedVariant)}
                  onClick={() => { if (qty > displayedItemStock) { setCheckoutMsg(`Only ${displayedItemStock} available for this option.`); return; } const chosen=Array.from({ length: qty }, () => ({ ...item, price_inr: displayedItemPrice, stock_quantity: displayedItemStock, variant_id: selectedVariant?.id || null, variant_label: selectedVariant?.label || null, abhimantrit_selected: !!(item.abhimantrit_available && abhimantritChoice), certificate_selected: !!(item.certificate_available && certificateChoice) })); setCart(chosen); setItem(null); window.setTimeout(() => openSecureCheckout(), 0); }}
                >
                  BUY NOW
                </button>
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
