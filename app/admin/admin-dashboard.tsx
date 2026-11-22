"use client";
import { FormEvent, Fragment, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  LogOut,
  Trash2,
  Save,
  Store,
  Layers,
  Package,
  Settings,
  Star,
  ClipboardList,
  Users,
  ShieldCheck,
  UserPlus,
  UserX,
  Globe,
} from "lucide-react";
// Keep admin catalogue thumbnails lightweight. Supabase Storage image rendering
// serves small WebP previews; if transformations are unavailable, the image falls back
// to its original URL. Full-size originals remain available in the product editor.
function adminThumbnail(url: string, width = 160) {
  if (!url) return "/placeholder.png";
  const marker = "/storage/v1/object/public/";
  if (!url.includes(marker)) return url;
  const [base, query = ""] = url.split("?");
  const transformed = base.replace(marker, "/storage/v1/render/image/public/");
  const params = new URLSearchParams(query);
  params.set("width", String(width));
  params.set("height", String(width));
  params.set("resize", "cover");
  params.set("quality", "58");
  params.set("format", "webp");
  return transformed + "?" + params.toString();
}

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  collection_type: "category" | "purpose" | "planet";
};
type Prod = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_inr: number;
  compare_at_price_inr: number | null;
  stock_quantity: number;
  category_id: string | null;
  primary_image_url: string;
  image_urls: string[];
  badge: string | null;
  is_active: boolean;
  is_featured: boolean;
};
type Review = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title: string;
  body: string;
  is_approved: boolean;
  created_at: string;
};
type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price_inr: number;
  line_total_inr: number;
};
type Customer = {
  id: string;
  auth_user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  updated_at: string;
};
type Coupon = { id?: string; code: string; discount_type: "percentage" | "fixed"; discount_value: number; min_order_inr: number; max_discount_inr: number | null; starts_at: string | null; ends_at: string | null; max_uses: number | null; usage_count: number; is_active: boolean; is_public: boolean; show_on_dashboard: boolean };
type AstrologyEnquiry = { id:string; full_name:string; mobile:string; email:string; address:string; service:string; preferred_time:string|null; details:string|null; status:string; email_status:string; created_at:string };
type AstrologyService = { name:string; description:string; active:boolean };
type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string | null;
  phone: string;
  shipping_address: Record<string, string>;
  total_inr: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  order_items: OrderItem[];
};
const blankCoupon: Coupon = { code: "", discount_type: "percentage", discount_value: 10, min_order_inr: 0, max_discount_inr: null, starts_at: null, ends_at: null, max_uses: null, usage_count: 0, is_active: true, is_public: true, show_on_dashboard: true };
const blankCat = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  parent_id: "",
  sort_order: 0,
  is_active: true,
  collection_type: "category",
};
const blankProd = {
  brand: "Shree Gauri",
  name: "",
  slug: "",
  sku: "",
  product_type: "",
  short_description: "",
  description: "",
  price_inr: 0,
  compare_at_price_inr: null,
  stock_quantity: 0,
  category_id: "",
  category_ids: [] as string[],
  primary_image_url: "",
  image_urls: [] as string[],
  gemstone_name: "",
  material: "",
  natural_lab_status: "",
  origin: "",
  treatment: "",
  certification: "",
  shape: "",
  color: "",
  weight_grams: null,
  carat_weight: null,
  is_one_of_one: false,
  certificate_available: false,
  certificate_price_inr: 0,
  abhimantrit_available: false,
  care_instructions: "",
  delivery_notes: "",
  return_notes: "",
  seo_title: "",
  seo_description: "",
  google_product_category: "",
  custom_shipping_enabled: false,
  custom_shipping_charge_inr: 0,
  badge: "",
  is_active: false,
  is_featured: false,
};
export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loginMode, setLoginMode] = useState<"admin" | "staff">("admin"),
    [error, setError] = useState(""),
    [isSigningIn, setIsSigningIn] = useState(false),
    [tab, setTab] = useState("dashboard"),
    [catalogView, setCatalogView] = useState<"products" | "inventory">("products"),
    [cats, setCats] = useState<Cat[]>([]),
    [products, setProducts] = useState<Prod[]>([]),
    [reviews, setReviews] = useState<Review[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [settings, setSettings] = useState<any>(null),
    [cat, setCat] = useState<any>(blankCat),
    [categoryFilter, setCategoryFilter] = useState<"category" | "purpose" | "planet">("category"),
    [categorySearch, setCategorySearch] = useState(""),
    [prod, setProd] = useState<any>(blankProd),
    [notice, setNotice] = useState(""),
    [previewOnly, setPreviewOnly] = useState(true),
    [readActivityIds, setReadActivityIds] = useState<string[]>([]),
    [legacyLastSeen, setLegacyLastSeen] = useState(0),
    [staffRole, setStaffRole] = useState<string>("loading"),
    [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false),
    [adminServiceConfigured, setAdminServiceConfigured] = useState(true),
    [staffRows, setStaffRows] = useState<any[]>([]),
    [staffEmail, setStaffEmail] = useState(""),
    [staffInviteRole, setStaffInviteRole] = useState("orders"),
    [needsPasswordSetup, setNeedsPasswordSetup] = useState(false),
    [newStaffPassword, setNewStaffPassword] = useState(""),
    [astrologyEnquiries, setAstrologyEnquiries] = useState<AstrologyEnquiry[]>([]),
    [astrologyServices, setAstrologyServices] = useState<AstrologyService[]>([]),
    [coupons, setCoupons] = useState<Coupon[]>([]),
    [couponDraft, setCouponDraft] = useState<Coupon>(blankCoupon),
    [shippingTab, setShippingTab] = useState<"shipping" | "coupons">("shipping"),
    [shippingSettings, setShippingSettings] = useState<any>({ id: 1, default_shipping_charge_inr: 0, free_shipping_enabled: false, free_shipping_threshold_inr: null, default_min_delivery_days: 3, default_max_delivery_days: 7 }),
    [shippingCompanies, setShippingCompanies] = useState<any[]>([]),
    [shippingCompanyDraft, setShippingCompanyDraft] = useState<any>({ name: "", tracking_url_template: "", default_charge_inr: 0, estimated_min_days: 3, estimated_max_days: 7, is_active: true }),
    [collectionSearch, setCollectionSearch] = useState(""),
    [quickEdit, setQuickEdit] = useState<{ id: string; field: "price_inr" | "stock_quantity"; value: string } | null>(null),
    [productQuery, setProductQuery] = useState(""),
    [productFilter, setProductFilter] = useState("all"),
    [selectedProductCategory, setSelectedProductCategory] = useState("all"),
    [productSort, setProductSort] = useState("newest"),
    [productPage, setProductPage] = useState(1),
    [productPageSize, setProductPageSize] = useState(24),
    [orderSearch, setOrderSearch] = useState(""),
    [orderStatusFilter, setOrderStatusFilter] = useState("all"),
    [customerSearch, setCustomerSearch] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/admin/environment", { cache: "no-store" }).then((response) => response.json()).then((data) => { if (active) setPreviewOnly(Boolean(data.preview_only)); }).catch(() => { if (active) setPreviewOnly(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session) load();
  }, [session]);
  useEffect(() => {
    if (!session?.user?.id || typeof window === "undefined") return;
    const refreshId = window.setInterval(() => { void load(); }, 30000);
    return () => window.clearInterval(refreshId);
  }, [session?.user?.id]);
  useEffect(() => {
    if (!session?.user?.id || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`sg-admin-read-activity:${session.user.id}`);
      const parsed = stored ? JSON.parse(stored) : [];
      setReadActivityIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
      setLegacyLastSeen(Number(localStorage.getItem("sg-admin-last-seen") || "0"));
    } catch {
      setReadActivityIds([]);
      setLegacyLastSeen(0);
    }
  }, [session?.user?.id]);
  async function signOutAdmin() {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      // Clear the visible admin state even if the auth endpoint is temporarily unavailable.
      setSession(null);
      setStaffRole("loading");
      setIsPrimaryAdmin(false);
      setNeedsPasswordSetup(false);
      setNotice("");
      setError("");
      setPassword("");
      setEmail("");
    }
  }
  async function load() {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return;
    let activeSession = currentSession;
    let roleResponse = await fetch("/api/admin/manage", { headers: { Authorization: `Bearer ${activeSession.access_token}` } });
    // A preview tab can keep an expired access token after sitting open. Refresh it once
    // and retry permission verification before showing the user an access-denied screen.
    if (roleResponse.status === 401) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshed.session && !refreshError) {
        activeSession = refreshed.session;
        setSession(refreshed.session);
        roleResponse = await fetch("/api/admin/manage", { headers: { Authorization: `Bearer ${activeSession.access_token}` } });
      } else {
        await signOutAdmin();
        setError("Your sign-in session has expired. Please sign in again.");
        return;
      }
    }
    const roleData = await roleResponse.json().catch(() => ({}));
    if (!roleResponse.ok) { setStaffRole("unauthorized"); setNotice(roleData.error || "Admin access could not be verified."); return; }
    setStaffRole(roleData.role);
    setIsPrimaryAdmin(Boolean(roleData.is_primary_admin));
    setAdminServiceConfigured(roleData.service_configured !== false);
    setStaffRows(roleData.staff || []);
    setNeedsPasswordSetup(Boolean(roleData.needs_password_setup));
    await loadAstrology(currentSession.access_token);
    const [a, b, c, d, o, u] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("id", 1).single(),
      supabase
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("*,order_items(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (a.data) setCats(a.data);
    if (b.data)
      setProducts(
        b.data.map((p: any) => ({
          ...p,
          image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
        })),
      );
    if (c.data) setSettings(c.data);
    if (d.data) setReviews(d.data);
    if (o.data) setOrders(o.data as Order[]);
    if (u.data) setCustomers(u.data as Customer[]);
    const [shippingSettingsResponse, shippingCompaniesResponse] = await Promise.all([
      supabase.from("shipping_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("shipping_companies").select("*").order("name"),
    ]);
    if (shippingSettingsResponse.data) setShippingSettings(shippingSettingsResponse.data);
    if (shippingCompaniesResponse.data) setShippingCompanies(shippingCompaniesResponse.data);
    const couponResponse = await fetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${currentSession.access_token}` } });
    const couponResult = await couponResponse.json().catch(() => ({}));
    if (couponResponse.ok && Array.isArray(couponResult.coupons)) setCoupons(couponResult.coupons as Coupon[]);
  }
  async function loadAstrology(accessToken?: string) {
    const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    const { data: result, error } = await supabase.functions.invoke("astrology-admin", { body: { action:"list" }, headers: { Authorization: `Bearer ${token}` } });
    if (error || !result?.ok) { setNotice(result?.error || error?.message || "Unable to load astrology enquiries."); return; }
    setAstrologyEnquiries(result.enquiries || []);
    setAstrologyServices(result.services || []);
  }
  async function updateAstrologyStatus(id: string, status: string) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const current = (await supabase.auth.getSession()).data.session;
    if (!current) { setNotice("Your session expired. Please sign in again."); return; }
    const { data: result, error } = await supabase.functions.invoke("astrology-admin", { body:{ action:"update_status", id, status }, headers:{ Authorization:`Bearer ${current.access_token}` } });
    setNotice(result?.message || result?.error || error?.message || "Unable to update enquiry.");
    if (result?.ok) await loadAstrology(current.access_token);
  }
  async function saveAstrologyServices() {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const current = (await supabase.auth.getSession()).data.session;
    if (!current) { setNotice("Your session expired. Please sign in again."); return; }
    const { data: result, error } = await supabase.functions.invoke("astrology-admin", { body:{ action:"save_services", services:astrologyServices }, headers:{ Authorization:`Bearer ${current.access_token}` } });
    setNotice(result?.message || result?.error || error?.message || "Unable to save services.");
    if (result?.ok) { setAstrologyServices(result.services || astrologyServices); await loadAstrology(current.access_token); }
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    if (isSigningIn) return;
    setError("");
    setIsSigningIn(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError || !data.session) {
        setError(signInError?.message || "Unable to start a secure session. Please check your details and try again.");
        return;
      }
      const roleResponse = await fetch("/api/admin/manage", {
        cache: "no-store",
        headers: { Authorization: "Bearer " + data.session.access_token },
      });
      const roleData = await roleResponse.json().catch(() => ({}));
      const isMainAdmin = roleResponse.ok && roleData.is_primary_admin === true;
      const isStaff = roleResponse.ok && roleData.is_primary_admin !== true && ["admin", "manager", "orders", "support", "catalog"].includes(roleData.role);
      if ((loginMode === "admin" && !isMainAdmin) || (loginMode === "staff" && !isStaff)) {
        await supabase.auth.signOut({ scope: "local" });
        setError(!roleResponse.ok
          ? (roleData.error || "We could not verify your admin access. Please try again or contact the main administrator.")
          : loginMode === "admin"
            ? "This email is not assigned to the main administrator account. Choose Staff Login if you have staff access."
            : "This email does not have an active staff role. Ask the main administrator to enable your access.");
        return;
      }
      setSession(data.session);
    } catch {
      setError("We couldn't complete sign-in because the server could not be reached. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }
  async function runAdminAction(action: string, payload: Record<string, unknown> = {}) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return false; }
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) { setNotice("Your session expired. Please sign in again."); return false; }
    const response = await fetch("/api/admin/manage", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentSession.access_token}` }, body: JSON.stringify({ action, ...payload }) });
    const result = await response.json().catch(() => ({}));
    setNotice(result.message || result.error || (response.ok ? "Done." : "Action failed."));
    if (response.ok) await load();
    return response.ok;
  }
  async function deleteAdminRecord(kind: "customer" | "order", id: string) {
    if (!isPrimaryAdmin) { setNotice("Only the primary main administrator can delete records."); return; }
    const warning = kind === "order"
      ? "Permanently delete this order and its line items/reservations? A restricted audit record will retain its payment reference for reconciliation."
      : "Delete this customer profile and personal data? Any linked order history will be anonymized and retained for financial reconciliation.";
    if (!window.confirm(warning)) return;
    await runAdminAction(kind === "order" ? "delete_order" : "delete_customer", { id });
  }
  async function inviteStaff(e: FormEvent) {
    e.preventDefault();
    if (!isPrimaryAdmin) return;
    const ok = await runAdminAction("invite_staff", { email: staffEmail, role: staffInviteRole });
    if (ok) setStaffEmail("");
  }
  async function removeStaff(userId: string) {
    if (!isPrimaryAdmin || !window.confirm("Revoke this team member’s Shree Gauri access? The primary main administrator account is protected.")) return;
    await runAdminAction("remove_staff", { user_id: userId });
  }
  async function saveStaffPassword(e: FormEvent) {
    e.preventDefault();
    if (newStaffPassword.length < 12) { setNotice("Use at least 12 characters."); return; }
    const ok = await runAdminAction("set_password", { password: newStaffPassword });
    if (ok) { setNewStaffPassword(""); await supabase.auth.refreshSession(); }
  }

  async function upload(file: File, kind: "cat" | "prod") {
    setNotice("Uploading image...");
    const path = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (error) {
      setNotice(error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    kind === "cat"
      ? setCat({ ...cat, image_url: data.publicUrl })
      : setProd({ ...prod, primary_image_url: data.publicUrl });
    setNotice("Image ready. Save the item to apply it.");
  }
  async function uploadGallery(files: FileList) {
    setNotice(`Uploading ${files.length} additional image(s)...`);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file);
      if (error) {
        setNotice(error.message);
        return;
      }
      urls.push(
        supabase.storage.from("product-images").getPublicUrl(path).data
          .publicUrl,
      );
    }
    setProd((current: any) => ({ ...current, image_urls: [...new Set([...(current.image_urls || []), ...urls])] }));
    setNotice(`${urls.length} additional image(s) ready. Save the product below.`);
  }
  async function moderateReview(id: string, is_approved: boolean) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const { error } = await supabase
      .from("product_reviews")
      .update({ is_approved })
      .eq("id", id);
    setNotice(
      error?.message || (is_approved ? "Review approved." : "Review hidden."),
    );
    load();
  }
  async function uploadSetting(
    file: File,
    field: "brand_logo_url" | "hero_image_url" | "founder_image_url",
  ) {
    setNotice("Uploading image...");
    const path = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (error) {
      setNotice(error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setSettings({ ...settings, [field]: data.publicUrl });
    setNotice("Image ready. Click Save All Website Settings.");
  }
  async function toggleCategoryVisibility(item: Cat) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const nextVisible = !item.is_active;
    setNotice((nextVisible ? "Making " : "Hiding ") + item.name + "...");
    const { error } = await supabase.from("categories").update({ is_active: nextVisible }).eq("id", item.id);
    if (error) {
      setNotice("Visibility could not be updated: " + error.message);
      return;
    }
    setCats((current) => current.map((c) => c.id === item.id ? { ...c, is_active: nextVisible } : c));
    if (cat.id === item.id) setCat((current: any) => ({ ...current, is_active: nextVisible }));
    setNotice(item.name + (nextVisible ? " is now visible on the website." : " is now hidden from the website."));
  }
  async function saveCat() {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const data = {
      ...cat,
      collection_type: cat.collection_type || "category",
      parent_id: cat.parent_id || null,
      slug:
        cat.slug ||
        cat.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      sort_order: Number(cat.sort_order),
    };
    const r = cat.id
      ? await supabase.from("categories").update(data).eq("id", cat.id)
      : await supabase.from("categories").insert(data);
    if (r.error) setNotice(r.error.message);
    else {
      setNotice("Category saved.");
      setCat({ ...blankCat, collection_type: categoryFilter });
      load();
    }
  }
  async function saveProd() {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    setNotice("Saving product...");
    const { data: authData, error: authError } = await supabase.auth.refreshSession();
    if (authError || !["admin", "manager", "catalog"].includes(staffRole)) {
      setNotice("Your session is invalid or your role cannot manage products.");
      return;
    }
    const productName = String(prod.name || "").trim();
    const productDescription = String(prod.short_description || prod.description || "").replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
    const generatedSeoTitle = productName ? (productName + " | Shree Gauri").slice(0, 60) : "";
    const generatedSeoDescription = (productDescription || (productName ? "Explore " + productName + " at Shree Gauri. Discover authentic products with secure ordering and convenient delivery across India." : "")).slice(0, 155);
    const selectedCategoryNames = cats.filter((c) => (Array.isArray(prod.category_ids) ? prod.category_ids : []).includes(c.id) || c.id === prod.category_id).map((c) => c.name);
    const detectedGoogleCategory = prod.google_product_category || (/(bracelet|mala|necklace|ring|pendant)/i.test(productName + " " + (prod.product_type || "")) ? "Apparel & Accessories > Jewelry" : /(pooja|puja|havan|tarpan)/i.test(productName + " " + (prod.product_type || "")) ? "Religious & Ceremonial" : selectedCategoryNames[0] || "");
    const data = {
      ...prod,
      brand: "Shree Gauri",
      seo_title: prod.seo_title || generatedSeoTitle,
      seo_description: prod.seo_description || generatedSeoDescription,
      google_product_category: detectedGoogleCategory,
      slug:
        prod.slug ||
        productName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      category_id: prod.category_id || null,
      category_ids: Array.from(new Set([...(Array.isArray(prod.category_ids) ? prod.category_ids : []), ...(prod.category_id ? [prod.category_id] : [])])),
      custom_shipping_enabled: Boolean(prod.custom_shipping_enabled),
      custom_shipping_charge_inr: Number.isFinite(Number(prod.custom_shipping_charge_inr)) ? Math.max(0, Number(prod.custom_shipping_charge_inr)) : 0,
      price_inr: Number(prod.price_inr),
      compare_at_price_inr: prod.compare_at_price_inr
        ? Number(prod.compare_at_price_inr)
        : null,
      stock_quantity: Number(prod.stock_quantity),
    };
    const r = prod.id
      ? await supabase.from("products").update(data).eq("id", prod.id)
      : await supabase.from("products").insert(data);
    if (r.error) {
      setNotice(`Product could not be saved: ${r.error.message}`);
      return;
    }
    setNotice("Product saved successfully.");
    setProd(blankProd);
    await load();
  }
  async function saveQuickProductField(id: string, field: "price_inr" | "stock_quantity", rawValue: string) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); setQuickEdit(null); return; }
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0 || (field === "stock_quantity" && !Number.isInteger(value))) {
      setNotice(field === "price_inr" ? "Enter a valid price of ₹0 or more." : "Stock must be a whole number of 0 or more.");
      setQuickEdit(null); return;
    }
    const { error } = await supabase.from("products").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { setNotice("Could not update " + (field === "price_inr" ? "price: " : "stock: ") + error.message); return; }
    setProducts((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setQuickEdit(null); setNotice(field === "price_inr" ? "Price updated." : "Stock quantity updated.");
  }

  async function toggleProductVisibility(p: Prod) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const next = !p.is_active;
    const { error } = await supabase
      .from("products")
      .update({ is_active: next })
      .eq("id", p.id);
    setNotice(error?.message || (next ? "Product is now visible on the website." : "Product hidden from the website."));
    if (!error && prod.id === p.id) setProd({ ...prod, is_active: next });
    load();
  }

  async function remove(table: string, id: string) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    if (!confirm("Delete this permanently?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    setNotice(error?.message || "Deleted.");
    load();
  }
  async function saveSettings() {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const { error } = await supabase
      .from("site_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setNotice(error?.message || "Website content updated.");
  }
  async function saveCourierDetails(e: FormEvent<HTMLFormElement>, order: Order) {
    if (previewOnly) { e.preventDefault(); setNotice("Read-only preview: tracking edits are disabled to protect live orders."); return; }
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const courier_company_id = String(form.get("courier_company_id") || "") || null;
    const selectedCourier = shippingCompanies.find((company) => company.id === courier_company_id);
    const courier_name = selectedCourier?.name || String(form.get("courier_name") || "").trim();
    const tracking_number = String(form.get("tracking_number") || "").trim();
    let tracking_url = String(form.get("tracking_url") || "").trim();
    if (!tracking_url && selectedCourier?.tracking_url_template && tracking_number) {
      tracking_url = String(selectedCourier.tracking_url_template).replaceAll("{tracking_number}", encodeURIComponent(tracking_number));
    }
    const courier_charge_inr = selectedCourier ? Number(selectedCourier.default_charge_inr || 0) : Number(form.get("courier_charge_inr") || 0);
    const dispatch_date = String(form.get("dispatch_date") || "") || null;
    const expected_delivery_date = String(form.get("expected_delivery_date") || "") || null;
    const { error } = await supabase.from("orders").update({ courier_company_id, courier_name: courier_name || null, courier_charge_inr, tracking_number: tracking_number || null, tracking_url: tracking_url || null, dispatch_date, expected_delivery_date, tracking_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id);
    if (error) { setNotice("Tracking details could not be saved: " + error.message); return; }
    setOrders((current) => current.map((o) => o.id === order.id ? { ...o, courier_company_id, courier_name, courier_charge_inr, tracking_number, tracking_url, dispatch_date, expected_delivery_date } as Order : o));
    setNotice("Courier and tracking details saved for " + order.order_number + ".");
  }
  async function saveShippingSettings(e: FormEvent<HTMLFormElement>) {
    if (previewOnly) { e.preventDefault(); setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    e.preventDefault();
    const payload = {
      id: 1,
      default_shipping_charge_inr: Math.max(0, Number(shippingSettings.default_shipping_charge_inr || 0)),
      free_shipping_enabled: Boolean(shippingSettings.free_shipping_enabled),
      free_shipping_threshold_inr: shippingSettings.free_shipping_enabled && shippingSettings.free_shipping_threshold_inr !== "" && shippingSettings.free_shipping_threshold_inr !== null ? Math.max(0, Number(shippingSettings.free_shipping_threshold_inr)) : null,
      default_min_delivery_days: Math.max(0, Math.floor(Number(shippingSettings.default_min_delivery_days || 0))),
      default_max_delivery_days: Math.max(0, Math.floor(Number(shippingSettings.default_max_delivery_days || 0))),
      updated_at: new Date().toISOString(),
    };
    if (payload.default_max_delivery_days < payload.default_min_delivery_days) { setNotice("Maximum delivery days must be at least the minimum."); return; }
    const { error } = await supabase.from("shipping_settings").upsert(payload, { onConflict: "id" });
    if (error) { setNotice("Shipping settings could not be saved: " + error.message); return; }
    setShippingSettings(payload);
    setNotice("Shipping charges and delivery rules saved.");
  }
  async function saveShippingCompany(e: FormEvent<HTMLFormElement>) {
    if (previewOnly) { e.preventDefault(); setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    e.preventDefault();
    const payload = {
      name: String(shippingCompanyDraft.name || "").trim(),
      tracking_url_template: String(shippingCompanyDraft.tracking_url_template || "").trim() || null,
      default_charge_inr: Math.max(0, Number(shippingCompanyDraft.default_charge_inr || 0)),
      estimated_min_days: Math.max(0, Math.floor(Number(shippingCompanyDraft.estimated_min_days || 0))),
      estimated_max_days: Math.max(0, Math.floor(Number(shippingCompanyDraft.estimated_max_days || 0))),
      is_active: Boolean(shippingCompanyDraft.is_active),
      updated_at: new Date().toISOString(),
    };
    if (!payload.name) { setNotice("Enter a courier or delivery partner name."); return; }
    if (payload.estimated_max_days < payload.estimated_min_days) { setNotice("Courier maximum delivery days must be at least the minimum."); return; }
    const query = shippingCompanyDraft.id
      ? supabase.from("shipping_companies").update(payload).eq("id", shippingCompanyDraft.id)
      : supabase.from("shipping_companies").insert(payload);
    const { error } = await query;
    if (error) { setNotice("Courier could not be saved: " + error.message); return; }
    setShippingCompanyDraft({ name: "", tracking_url_template: "", default_charge_inr: 0, estimated_min_days: 3, estimated_max_days: 7, is_active: true });
    const { data } = await supabase.from("shipping_companies").select("*").order("name");
    if (data) setShippingCompanies(data);
    setNotice("Courier / delivery partner saved.");
  }
  async function toggleShippingCompany(company: any) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    const { error } = await supabase.from("shipping_companies").update({ is_active: !company.is_active, updated_at: new Date().toISOString() }).eq("id", company.id);
    if (error) { setNotice("Courier status could not be changed: " + error.message); return; }
    setShippingCompanies((current) => current.map((item) => item.id === company.id ? { ...item, is_active: !company.is_active } : item));
    setNotice(company.name + (company.is_active ? " paused." : " activated."));
  }
  async function saveCoupon(e: FormEvent<HTMLFormElement>) {
    if (previewOnly) { e.preventDefault(); setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    e.preventDefault();
    const code = couponDraft.code.trim().toUpperCase().replace(/\\s+/g, "");
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) { setNotice("Coupon code must be 3–32 letters, numbers, hyphens or underscores."); return; }
    if (!Number.isFinite(Number(couponDraft.discount_value)) || Number(couponDraft.discount_value) <= 0 || (couponDraft.discount_type === "percentage" && Number(couponDraft.discount_value) > 100)) { setNotice("Enter a valid discount value (percentage must be 100 or less)."); return; }
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) { setNotice("Your admin session expired. Please sign in again."); return; }
    const response = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${current.access_token}` }, body: JSON.stringify({ action: "save", id: couponDraft.id || null, coupon: { ...couponDraft, code, discount_value: Number(couponDraft.discount_value), min_order_inr: Number(couponDraft.min_order_inr || 0), max_discount_inr: couponDraft.max_discount_inr === null || couponDraft.max_discount_inr === ("" as any) ? null : Number(couponDraft.max_discount_inr), max_uses: couponDraft.max_uses ? Number(couponDraft.max_uses) : null } }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(result.error || "Coupon could not be saved."); return; }
    setCoupons(result.coupons || []);
    setCouponDraft(blankCoupon);
    setNotice("Coupon " + code + " saved and ready for checkout.");
  }
  async function toggleCoupon(coupon: Coupon) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    if (!coupon.id) return;
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) { setNotice("Your admin session expired. Please sign in again."); return; }
    const response = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${current.access_token}` }, body: JSON.stringify({ action: "toggle", id: coupon.id }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(result.error || "Coupon status could not be changed."); return; }
    setCoupons(result.coupons || []);
    setNotice(coupon.code + (coupon.is_active ? " paused." : " activated."));
  }
  async function deleteCoupon(coupon: Coupon) {
    if (previewOnly) { setNotice("Read-only preview: changes are disabled to protect live store data."); return; }
    if (!coupon.id || !window.confirm("Delete coupon " + coupon.code + "? This cannot be undone.")) return;
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) { setNotice("Your admin session expired. Please sign in again."); return; }
    const response = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${current.access_token}` }, body: JSON.stringify({ action: "delete", id: coupon.id }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(result.error || "Coupon could not be deleted."); return; }
    setCoupons(result.coupons || []);
    setNotice(coupon.code + " deleted.");
  }
  async function updateOrder(id: string, order_status: string) {
    if (previewOnly) { setNotice("Read-only preview: status changes are disabled to protect live orders."); return; }
    setNotice(`Updating order to ${order_status}...`);
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    if (!token) { setNotice("Admin session expired. Please log in again."); return; }
    const response = await fetch("/api/admin/order-status", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: id, order_status }) });
    const data = await response.json().catch(() => ({}));
    setNotice(data?.error || (data?.preview_only ? "Status changes are disabled in preview to protect live orders." : data?.email_sent ? `Order marked ${order_status}. Professional customer email sent.` : `Order marked ${order_status}. Email status: ${data?.warning || "not sent"}`));
    if (response.ok && !data?.error) load();
  }
  const activity = [
    ...orders.slice(0, 12).map((o) => ({ id: `order-${o.id}`, time: new Date(o.created_at).getTime(), title: `New order ${o.order_number}`, detail: `${o.customer_name} · ₹${Number(o.total_inr).toLocaleString("en-IN")} · ${o.payment_status || o.order_status}`, kind: "order" })),
    ...reviews.slice(0, 12).map((r) => ({ id: `review-${r.id}`, time: new Date(r.created_at).getTime(), title: "New customer review", detail: `${r.reviewer_name} · ${r.rating}/5 · ${r.title || "Review received"}`, kind: "review" })),
  ].sort((a, b) => b.time - a.time).slice(0, 15);
  const isActivityRead = (id: string, time: number) => readActivityIds.includes(id) || time <= legacyLastSeen;
  const newActivityCount = activity.filter((a) => !isActivityRead(a.id, a.time)).length;
  const pendingOrders = orders.filter((o) => o.order_status === "pending").length;
  const pendingReviews = reviews.filter((r) => !r.is_approved).length;
  const lowStock = products.filter((p) => p.is_active && Number(p.stock_quantity) <= 3).length;
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productQuery.trim().toLowerCase()) &&
    (selectedProductCategory === "all" || p.category_id === selectedProductCategory || (Array.isArray(p.category_ids) && p.category_ids.includes(selectedProductCategory))) &&
    (productFilter === "all" || (productFilter === "active" && p.is_active) ||
      (productFilter === "hidden" && !p.is_active) ||
      (productFilter === "low-stock" && Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 3) ||
      (productFilter === "out-of-stock" && Number(p.stock_quantity) <= 0))
  );
  const sortedProducts = [...filteredProducts].sort((left, right) => {
    if (productSort === "name-asc") return left.name.localeCompare(right.name);
    if (productSort === "price-low") return Number(left.price_inr) - Number(right.price_inr);
    if (productSort === "price-high") return Number(right.price_inr) - Number(left.price_inr);
    if (productSort === "stock-low") return Number(left.stock_quantity) - Number(right.stock_quantity);
    if (productSort === "stock-high") return Number(right.stock_quantity) - Number(left.stock_quantity);
    return 0;
  });
  const productPageCount = Math.max(1, Math.ceil(sortedProducts.length / productPageSize));
  const currentProductPage = Math.min(productPage, productPageCount);
  const paginatedProducts = sortedProducts.slice((currentProductPage - 1) * productPageSize, currentProductPage * productPageSize);
  const pageNumbers = Array.from({ length: productPageCount }, (_, i) => i + 1)
    .filter((page) => productPageCount <= 7 || page === 1 || page === productPageCount || Math.abs(page - currentProductPage) <= 1);
  const paginationControls = (total: number) => (
    <div className="catalog-pagination">
      <label>Show
        <select value={productPageSize} onChange={(e) => { setProductPageSize(Number(e.target.value)); setProductPage(1); }}>
          <option value={12}>12</option><option value={24}>24</option><option value={48}>48</option><option value={96}>96</option><option value={200}>200</option>
        </select>
        per page
      </label>
      <span className="catalog-page-count">{total ? ((currentProductPage - 1) * productPageSize + 1) + "–" + Math.min(currentProductPage * productPageSize, total) + " of " + total : "0 products"}</span>
      <div className="catalog-page-buttons">
        <button type="button" disabled={currentProductPage === 1} onClick={() => setProductPage(currentProductPage - 1)}>Previous</button>
        {pageNumbers.map((page, index) => (
          <Fragment key={page}>
            {productPageCount > 7 && index > 0 && page - pageNumbers[index - 1] > 1 && <span className="catalog-page-ellipsis">…</span>}
            <button type="button" className={currentProductPage === page ? "current" : ""} aria-current={currentProductPage === page ? "page" : undefined} onClick={() => setProductPage(page)}>{page}</button>
          </Fragment>
        ))}
        <button type="button" disabled={currentProductPage === productPageCount} onClick={() => setProductPage(currentProductPage + 1)}>Next</button>
      </div>
    </div>
  );
  const paidRevenue = orders.filter((o) => ["paid", "success", "completed"].includes(String(o.payment_status || "").toLowerCase())).reduce((sum, o) => sum + Number(o.total_inr || 0), 0);
  function markActivityRead(id: string) {
    const next = Array.from(new Set([...readActivityIds, id]));
    setReadActivityIds(next);
    if (typeof window !== "undefined" && session?.user?.id) {
      localStorage.setItem(`sg-admin-read-activity:${session.user.id}`, JSON.stringify(next));
    }
  }
  function openDashboard() {
    setTab("dashboard");
  }

  if (!session)
    return (
      <main className="admin-login-premium">
        <div className="admin-login-shell">
          <section className="admin-login-art" aria-label="Shree Gauri administration">
            <a className="admin-login-return" href="/">← Return to store</a>
            <div className="admin-login-art-brand">
              <img src="/shree-gauri-logo.png" alt="Shree Gauri" />
              <div><span>SHREE GAURI</span><small>ADMINISTRATION</small></div>
            </div>
            <div className="admin-login-art-copy">
              <span className="admin-login-kicker">STORE CONTROL CENTRE</span>
              <h2>Thoughtful care.<br />Seamless management.</h2>
              <p>Everything you need to manage the Shree Gauri store, your catalogue and your team — in one place.</p>
            </div>
            <div className="admin-login-art-foot"><span>SHREE GAURI</span><i /> <small>PRIVATE ADMINISTRATOR PORTAL</small></div>
          </section>
          <section className="admin-login-panel">
            <div className="admin-login-panel-top"><span>WELCOME BACK</span><small>Sign in to continue</small></div>
            <h1>{loginMode === "admin" ? "Main Admin Login" : "Staff Login"}</h1>
            <p className="admin-login-intro">{loginMode === "admin" ? "Sign in with your main administrator credentials." : "Use your invited work email to access your assigned tasks."}</p>
            <div className="admin-login-mode" role="group" aria-label="Choose sign-in type">
              <button type="button" className={loginMode === "admin" ? "active" : ""} aria-pressed={loginMode === "admin"} onClick={() => { setLoginMode("admin"); setError(""); }}>Main Admin</button>
              <button type="button" className={loginMode === "staff" ? "active" : ""} aria-pressed={loginMode === "staff"} onClick={() => { setLoginMode("staff"); setError(""); }}>Staff Login</button>
            </div>
            <form className="admin-login-fields" onSubmit={login} autoComplete="off">
              <label>
                <span>Work email</span>
                <input type="email" name="sg-admin-email" autoComplete="off" placeholder={loginMode === "admin" ? "Enter main admin email" : "Enter your invited work email"} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                <span>Password</span>
                <input type="password" name="sg-admin-password" autoComplete="new-password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              {error && <b className="admin-login-error" role="alert">{error}</b>}
              <button className="admin-login-submit" type="submit" disabled={isSigningIn}>{isSigningIn ? "VERIFYING SECURE ACCESS…" : loginMode === "admin" ? "SIGN IN AS MAIN ADMIN" : "SIGN IN AS STAFF"} <span aria-hidden="true">{isSigningIn ? "…" : "→"}</span></button>
            </form>
            <div className="admin-login-panel-foot"><span className="admin-login-lock">◇</span><span>{loginMode === "admin" ? "Main administrator access" : "Role-based staff access"}</span><i /> <span>Shree Gauri</span></div>
          </section>
        </div>
      </main>
    );
  if (session && staffRole === "loading") return <main className="admin"><section className="admin-loading"><h1>Verifying staff access…</h1></section></main>;
  if (session && staffRole === "unauthorized") return <main className="admin"><section className="admin-loading"><h1>Access denied</h1><p>{notice || "This account is not authorized for Shree Gauri administration."}</p><button onClick={signOutAdmin}>Sign out</button></section></main>;
  if (session && needsPasswordSetup) return (
    <main className="admin-login"><form onSubmit={saveStaffPassword}><div className="admin-login-brand"><img src="/shree-gauri-logo.png" alt="Shree Gauri" /><span>SHREE GAURI</span><small>STAFF ACCOUNT SETUP</small></div><h1>Create your password</h1><p>Use at least 12 characters. Keep this password private.</p><label>New password<input type="password" minLength={12} autoComplete="new-password" value={newStaffPassword} onChange={(e) => setNewStaffPassword(e.target.value)} required /></label>{notice && <p>{notice}</p>}<button>SET PASSWORD</button></form></main>
  );
  return (
    <main className="admin">
      <aside>
        <h2>
          <Store /> Shree Gauri
        </h2>
        <span>Store Control Centre</span>
        <button className={tab === "dashboard" ? "on" : ""} onClick={openDashboard}>
          <Store /> Dashboard
          {newActivityCount > 0 && <b className="order-count">{newActivityCount}</b>}
        </button>
        {["admin", "manager", "orders", "support"].includes(staffRole) && (<button
          className={tab === "orders" ? "on" : ""}
          onClick={() => setTab("orders")}
        >
          <ClipboardList />
          Orders{" "}
          {orders.filter((o) => o.order_status === "pending").length > 0 && (
            <b className="order-count">
              {orders.filter((o) => o.order_status === "pending").length}
            </b>
          )}
        </button>
        )}
        {["admin", "manager", "orders", "support"].includes(staffRole) && (<button
          className={tab === "customers" ? "on" : ""}
          onClick={() => setTab("customers")}
        >
          <Users />
          Customers
          {customers.filter((c) => c.auth_user_id).length > 0 && (
            <b className="order-count">{customers.filter((c) => c.auth_user_id).length}</b>
          )}
        </button>
        )}
        {["admin", "manager", "catalog"].includes(staffRole) && (<button
          className={tab === "categories" ? "on" : ""}
          onClick={() => setTab("categories")}
        >
          <Layers />
          Product Categories
        </button>
        )}
        {["admin", "manager", "catalog"].includes(staffRole) && (<>
          <button className={tab === "products" || tab === "inventory" ? "on" : ""} onClick={() => { setCatalogView("products"); setTab("products"); }}><Package /> Products & Inventory {lowStock > 0 && <b className="order-count">{lowStock}</b>}</button>
          <button className={tab === "add-product" ? "on" : ""} onClick={() => { setProd(blankProd); setTab("add-product"); }}><Package /> Add New Product</button>
        </>)}
        {["admin", "manager"].includes(staffRole) && (<button
          className={tab === "reviews" ? "on" : ""}
          onClick={() => setTab("reviews")}
        >
          <Star />
          Customer Reviews
        </button>
        )}
        {staffRole === "admin" && (<button
          className={tab === "settings" ? "on" : ""}
          onClick={() => setTab("settings")}
        >
          <Settings />
          Photos, Logo & Homepage
        </button>
        )}
        {["admin", "manager", "support"].includes(staffRole) && <button className={tab === "astrology" ? "on" : ""} onClick={() => setTab("astrology")}><Star /> Astrology Enquiries {astrologyEnquiries.filter(e => e.status === "new").length > 0 && <b className="order-count">{astrologyEnquiries.filter(e => e.status === "new").length}</b>}</button>}
        {isPrimaryAdmin && <button className={tab === "currency" ? "on" : ""} onClick={() => setTab("currency")}><Globe /> Global Currency Rates</button>}
        {isPrimaryAdmin && <button className={tab === "shipping-coupons" ? "on" : ""} onClick={() => { setTab("shipping-coupons"); setShippingTab("shipping"); }}><Package /> Shipping & Coupons</button>}
        <footer className="admin-utility-actions" aria-label="Account and store actions">
          {isPrimaryAdmin && <button className={tab === "staff" ? "on" : ""} onClick={() => setTab("staff")}><ShieldCheck /> Staff & Permissions</button>}
          <a href="/"><Store /> View Store</a>
          <button className="admin-logout-action" onClick={signOutAdmin}><LogOut /> Log Out</button>
        </footer>
      </aside>
      <section>
        <header>
          <div>
            <small>ADMIN DASHBOARD</small>
            {previewOnly && <div role="status" style={{ marginTop: 10, padding: "9px 12px", border: "1px solid #ead9bd", borderRadius: 8, background: "#fff8ec", color: "#765b35", fontSize: 12, fontWeight: 700 }}>PREVIEW MODE · Read-only · Saves, order updates and emails are disabled to protect the live store.</div>}
            <h1>
              {tab === "dashboard"
                ? "Store Overview"
                : tab === "orders"
                ? "Customer Orders"
                : tab === "astrology"
                  ? "Astrology Enquiries"
                : tab === "staff"
                  ? "Staff & Permissions"
                : tab === "customers"
                  ? "Customer Accounts"
                : tab === "categories"
                  ? "Product Categories"
                  : tab === "products"
                    ? "Products & Inventory"
                    : tab === "reviews"
                      ? "Customer Review Approval"
                      : tab === "currency"
                        ? "Global Currency Rates"
                        : tab === "shipping-coupons"
                          ? (shippingTab === "shipping" ? "Courier & Delivery" : "Coupons & Offers")
                          : tab === "add-product"
                            ? (prod.id ? "Edit Product" : "Add New Product")
                            : "Photos, Logo & Homepage"}
            </h1>
          </div>
          {notice && <p>{notice}</p>}
        </header>
        {tab === "products" && (
          <div className="catalog-view-switch" role="tablist" aria-label="Product catalogue views">
            <button type="button" role="tab" aria-selected={catalogView === "products"} onClick={() => { setCatalogView("products"); setProductPage(1); }} className={catalogView === "products" ? "on" : ""}>Product List <span>{products.length}</span></button>
            <button type="button" role="tab" aria-selected={catalogView === "inventory"} onClick={() => { setCatalogView("inventory"); setProductPage(1); }} className={catalogView === "inventory" ? "on" : ""}>Stock Overview <span>{lowStock} low</span></button>
          </div>
        )}
        {tab === "dashboard" && (
          <div className="sg-dashboard">
            <div className="dashboard-stats">
              <button onClick={() => setTab("orders")}><small>TOTAL ORDERS</small><strong>{orders.length}</strong><span>{pendingOrders} pending</span></button>
              <button onClick={() => setTab("orders")}><small>PAID SALES</small><strong>₹{paidRevenue.toLocaleString("en-IN")}</strong><span>Recorded paid orders</span></button>
              <button onClick={() => setTab("products")}><small>PRODUCTS</small><strong>{products.length}</strong><span>{products.filter((p) => p.is_active).length} visible · {products.filter((p) => !p.is_active).length} hidden</span></button>
              <button onClick={() => setTab("products")}><small>LOW STOCK</small><strong>{lowStock}</strong><span>3 or fewer remaining</span></button>
              <button onClick={() => setTab("reviews")}><small>REVIEWS</small><strong>{reviews.length}</strong><span>{pendingReviews} awaiting approval</span></button>
            </div>
            <div className="dashboard-panels">
              <section className="activity-panel">
                <div className="dashboard-panel-head"><div><small>LIVE ACTIVITY</small><h2>Notifications</h2></div>{newActivityCount > 0 && <b>{newActivityCount} NEW</b>}</div>
                {activity.length ? activity.map((a) => (
                  <button key={a.id} className={`activity-row ${isActivityRead(a.id, a.time) ? "is-read" : "is-unread"}`} aria-label={`${a.title}, ${isActivityRead(a.id, a.time) ? "viewed" : "unread"}`} onClick={() => { markActivityRead(a.id); setTab(a.kind === "order" ? "orders" : "reviews"); }}>
                    <span className={a.kind}>{a.kind === "order" ? "O" : "★"}</span>
                    <div><b>{a.title}</b><small>{a.detail}</small><em>{new Date(a.time).toLocaleString("en-IN")}</em><small className="activity-read-state">{isActivityRead(a.id, a.time) ? "VIEWED" : "NEW"}</small></div>
                  </button>
                )) : <p className="dashboard-empty">New orders and reviews will appear here automatically.</p>}
              </section>
              <section className="dashboard-side-panel">
                <div className="dashboard-panel-head"><div><small>ATTENTION</small><h2>Store checks</h2></div></div>
                <button onClick={() => setTab("orders")}><b>{pendingOrders}</b><span>Orders awaiting action</span></button>
                <button onClick={() => setTab("reviews")}><b>{pendingReviews}</b><span>Reviews awaiting approval</span></button>
                <button onClick={() => setTab("products")}><b>{lowStock}</b><span>Low-stock products</span></button>
                <button onClick={() => setTab("products")}><b>{products.filter((p) => !p.is_active).length}</b><span>Hidden products</span></button>
              </section>
            </div>
          </div>
        )}
        {tab === "customers" && (
          <div className="customers-admin">
            <div className="customer-admin-summary">
              <div><small>TOTAL CUSTOMER RECORDS</small><strong>{customers.length}</strong></div>
              <div><small>REGISTERED ACCOUNTS</small><strong>{customers.filter((c) => c.auth_user_id).length}</strong></div>
              <div><small>CUSTOMERS WITH ORDERS</small><strong>{new Set(orders.map((o) => o.email?.toLowerCase()).filter(Boolean)).size}</strong></div>
            </div>
            <div className="record-toolbar">
              <input aria-label="Search customers" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search name, email or phone…" />
              <span>{customers.filter((c) => [c.full_name,c.email,c.phone].some((v) => String(v || "").toLowerCase().includes(customerSearch.toLowerCase()))).length} customers</span>
            </div>
            <div className="customer-admin-list">
              {customers.length ? customers.filter((c) => [c.full_name,c.email,c.phone].some((v) => String(v || "").toLowerCase().includes(customerSearch.toLowerCase()))).map((c) => {
                const customerOrders = orders.filter((o) =>
                  (c.id && (o as any).customer_id === c.id) ||
                  (!!c.email && !!o.email && o.email.toLowerCase() === c.email.toLowerCase())
                );
                const spent = customerOrders
                  .filter((o) => o.payment_status === "paid")
                  .reduce((sum, o) => sum + Number(o.total_inr || 0), 0);
                return (
                  <details key={c.id} className="customer-admin-card customer-record-details">
                    <summary className="customer-record-summary">
                      <div><strong className="customer-record-name">{c.full_name || "Customer"}</strong><small>{c.email || c.phone || "No contact details"}</small></div>
                      <span>{customerOrders.length} orders</span>
                      <span>₹{spent.toLocaleString("en-IN")} paid</span>
                      <b>View details⌄</b>
                    </summary>
                    <div className="customer-record-body">
                    <div className="customer-admin-head">
                      <div>
                        <span className={c.auth_user_id ? "account-live" : "account-guest"}>
                          {c.auth_user_id ? "REGISTERED ACCOUNT" : "CHECKOUT CUSTOMER"}
                        </span>
                        <h2>{c.full_name || "Customer"}</h2>
                        <small>Customer since {new Date(c.created_at).toLocaleDateString("en-IN")}</small>
                      </div>
                      <div className="customer-admin-metrics">
                        <span><b>{customerOrders.length}</b> Orders</span>
                        <span><b>₹{spent.toLocaleString("en-IN")}</b> Paid Value</span>
                      </div>
                    </div>
                    <div className="customer-admin-grid">
                      <div>
                        <small>CONTACT</small>
                        {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <span>—</span>}
                        {c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : <span>—</span>}
                      </div>
                      <div>
                        <small>PERSONAL</small>
                        <span>DOB: {c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString("en-IN") : "Not provided"}</span>
                        <span>Account: {c.auth_user_id ? "Active customer login" : "No login linked"}</span>
                      </div>
                      <div>
                        <small>SAVED ADDRESS</small>
                        <span>{[c.address_line1,c.address_line2,c.city,c.state,c.pincode].filter(Boolean).join(", ") || "Not provided"}</span>
                      </div>
                    </div>
                    {customerOrders.length > 0 && (
                      <div className="customer-admin-orders">
                        <small>RECENT ORDERS</small>
                        {customerOrders.slice(0,3).map((o) => (
                          <span key={o.id}><b>{o.order_number}</b>{o.order_status} • ₹{Number(o.total_inr).toLocaleString("en-IN")}</span>
                        ))}
                      </div>
                    )}
                    {isPrimaryAdmin && <div className="customer-admin-actions"><button className="delete" onClick={() => deleteAdminRecord("customer", c.id)}><Trash2 /> DELETE CUSTOMER DATA</button></div>}
                    </div>
                  </details>
                );
              }) : <div className="admin-empty"><Users/><p>No customers yet.</p></div>}
            </div>
          </div>
        )}
        {tab === "orders" && (
          <div className="orders-admin">
            <div className="record-toolbar order-record-toolbar">
              <input aria-label="Search orders" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search order number, customer, email or phone…" />
              <select aria-label="Filter orders by status" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}><option value="all">All statuses</option>{["pending","confirmed","processing","packed","shipped","delivered","cancelled"].map((status) => <option key={status} value={status}>{status === "shipped" ? "Dispatched" : status}</option>)}</select>
              <span>{orders.filter((o) => (orderStatusFilter === "all" || o.order_status === orderStatusFilter) && [o.order_number,o.customer_name,o.email,o.phone].some((v) => String(v || "").toLowerCase().includes(orderSearch.toLowerCase()))).length} orders</span>
            </div>
            {orders.length ? (
              orders.filter((o) => (orderStatusFilter === "all" || o.order_status === orderStatusFilter) && [o.order_number,o.customer_name,o.email,o.phone].some((v) => String(v || "").toLowerCase().includes(orderSearch.toLowerCase()))).map((o) => (
                <details key={o.id} className={`order-card order-record-details ${o.order_status}`}>
                  <summary className="order-record-summary">
                    <div><small>{new Date(o.created_at).toLocaleDateString("en-IN")}</small><strong>{o.order_number}</strong></div>
                    <strong className="order-customer-name">{o.customer_name}</strong><span>₹{Number(o.total_inr).toLocaleString("en-IN")}</span><b>{o.order_status === "shipped" ? "DISPATCHED" : o.order_status.toUpperCase()}</b><i>View details⌄</i>
                  </summary>
                  <div className="order-record-body">
                  <div className="order-heading">
                    <div>
                      <small>
                        {new Date(o.created_at).toLocaleString("en-IN")}
                      </small>
                      <h2>{o.order_number}</h2>
                    </div>
                    <span>{o.order_status.toUpperCase()}</span>
                  </div>
                  <div className="order-customer">
                    <b>{o.customer_name}</b>
                    <a href={`tel:${o.phone}`}>{o.phone}</a>
                    {o.email && <a href={`mailto:${o.email}`}>{o.email}</a>}
                    <p>
                      {[
                        o.shipping_address.line1,
                        o.shipping_address.line2,
                        o.shipping_address.city,
                        o.shipping_address.state,
                        o.shipping_address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="order-products">
                    {o.order_items.map((i) => (
                      <div key={i.id}>
                        <span>
                          {i.quantity} × {i.product_name}
                        </span>
                        <b>
                          ₹{Number(i.line_total_inr).toLocaleString("en-IN")}
                        </b>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <span>Total</span>
                    <strong>
                      ₹{Number(o.total_inr).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <form className="order-tracking-editor" onSubmit={(e) => saveCourierDetails(e, o)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, padding: 14, margin: "14px 0", border: "1px solid #eadfd4", borderRadius: 9, background: "#fffdf9" }}>
                    <label style={{ display: "grid", gap: 5, fontSize: 11, color: "#705d52", fontWeight: 700 }}>COURIER / DELIVERY PARTNER<select name="courier_company_id" defaultValue={(o as any).courier_company_id || shippingCompanies.find((company) => company.name === (o as any).courier_name)?.id || ""}><option value="">Select courier</option>{shippingCompanies.filter((company) => company.is_active).map((company) => <option key={company.id} value={company.id}>{company.name} · ₹{Number(company.default_charge_inr || 0).toLocaleString("en-IN")}</option>)}</select></label>
                    <label style={{ display: "grid", gap: 5, fontSize: 11, color: "#705d52", fontWeight: 700 }}>TRACKING NUMBER<input name="tracking_number" defaultValue={(o as any).tracking_number || ""} placeholder="Article / consignment / AWB number" /></label>
                    <label style={{ display: "grid", gap: 5, fontSize: 11, color: "#705d52", fontWeight: 700 }}>TRACKING URL<input name="tracking_url" type="url" defaultValue={(o as any).tracking_url || ""} placeholder="https://…" /></label>
                    <label style={{ display: "grid", gap: 5, fontSize: 11, color: "#705d52", fontWeight: 700 }}>DISPATCH DATE<input name="dispatch_date" type="date" defaultValue={(o as any).dispatch_date || ""} /></label>
                    <label style={{ display: "grid", gap: 5, fontSize: 11, color: "#705d52", fontWeight: 700 }}>EXPECTED DELIVERY<input name="expected_delivery_date" type="date" defaultValue={(o as any).expected_delivery_date || ""} /></label>
                    <button type="submit" style={{ alignSelf: "end", minHeight: 42, border: 0, borderRadius: 6, background: "#4a111a", color: "#fff", fontWeight: 800 }}>SAVE TRACKING</button>
                    {(o as any).tracking_url && <a href={(o as any).tracking_url} target="_blank" rel="noreferrer" style={{ alignSelf: "center", color: "#8b622e", fontWeight: 700 }}>TRACK SHIPMENT ↗</a>}
                  </form>
                  <div className="order-actions">
                    <a
                      href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "91")}?text=${encodeURIComponent(`Hello ${o.customer_name}, your Shree Gauri order ${o.order_number} is ${o.order_status}.`)}`}
                      target="_blank"
                    >
                      MESSAGE CUSTOMER
                    </a>
                    <select
                      value={o.order_status}
                      onChange={(e) => updateOrder(o.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {isPrimaryAdmin && <button className="delete order-delete-button" onClick={() => deleteAdminRecord("order", o.id)}><Trash2 /> DELETE ORDER</button>}
                  </div>
                  </div>
                </details>
              ))
            ) : (
              <div className="admin-empty">
                <ClipboardList />
                <h3>No orders yet</h3>
                <p>New website orders will appear here automatically.</p>
              </div>
            )}
          </div>
        )}
        {tab === "shipping-coupons" && isPrimaryAdmin && (
          <div className="shipping-coupon-workspace" style={{ display: "grid", gap: 22, maxWidth: 1120 }}>
            <div className="shipping-coupon-tabs" role="tablist" aria-label="Shipping and coupon management">
              <button type="button" role="tab" aria-selected={shippingTab === "shipping"} className={shippingTab === "shipping" ? "active" : ""} onClick={() => setShippingTab("shipping")}>Shipping & Delivery</button>
              <button type="button" role="tab" aria-selected={shippingTab === "coupons"} className={shippingTab === "coupons" ? "active" : ""} onClick={() => setShippingTab("coupons")}>Coupons & Offers</button>
            </div>
            {shippingTab === "shipping" && <>
              <section className="shipping-settings-card">
                <div><small>DELIVERY RULES</small><h2>Shipping charges & free delivery</h2><p>Set the default shipping charge and decide when customers qualify for free shipping.</p></div>
                <form onSubmit={saveShippingSettings} className="shipping-settings-form">
                  <label>Default shipping charge (₹)<input type="number" min="0" step="1" value={shippingSettings.default_shipping_charge_inr ?? 0} onChange={(e) => setShippingSettings({ ...shippingSettings, default_shipping_charge_inr: e.target.value })} /></label>
                  <label className="shipping-toggle"><input type="checkbox" checked={Boolean(shippingSettings.free_shipping_enabled)} onChange={(e) => setShippingSettings({ ...shippingSettings, free_shipping_enabled: e.target.checked })} /> Enable free shipping above a cart value</label>
                  <label>Free shipping threshold (₹)<input type="number" min="0" step="1" disabled={!shippingSettings.free_shipping_enabled} value={shippingSettings.free_shipping_threshold_inr ?? ""} onChange={(e) => setShippingSettings({ ...shippingSettings, free_shipping_threshold_inr: e.target.value })} placeholder="e.g. 1499" /></label>
                  <label>Estimated minimum delivery (days)<input type="number" min="0" step="1" value={shippingSettings.default_min_delivery_days ?? 3} onChange={(e) => setShippingSettings({ ...shippingSettings, default_min_delivery_days: e.target.value })} /></label>
                  <label>Estimated maximum delivery (days)<input type="number" min="0" step="1" value={shippingSettings.default_max_delivery_days ?? 7} onChange={(e) => setShippingSettings({ ...shippingSettings, default_max_delivery_days: e.target.value })} /></label>
                  <div className="shipping-form-actions"><button type="submit">SAVE SHIPPING SETTINGS</button></div>
                </form>
              </section>
              <section className="shipping-settings-card">
                <div><small>DELIVERY PARTNERS</small><h2>Courier & shipping companies</h2><p>Add courier services, default courier charges and tracking URL templates for order dispatch.</p></div>
                <form onSubmit={saveShippingCompany} className="shipping-settings-form">
                  <label>Courier / delivery partner<input required value={shippingCompanyDraft.name} onChange={(e) => setShippingCompanyDraft({ ...shippingCompanyDraft, name: e.target.value })} placeholder="e.g. Delhivery, Blue Dart, India Post" /></label>
                  <label>Tracking URL template<input value={shippingCompanyDraft.tracking_url_template || ""} onChange={(e) => setShippingCompanyDraft({ ...shippingCompanyDraft, tracking_url_template: e.target.value })} placeholder="https://tracking.example/track?awb={tracking_number}" /></label>
                  <label>Default courier charge (₹)<input type="number" min="0" value={shippingCompanyDraft.default_charge_inr ?? 0} onChange={(e) => setShippingCompanyDraft({ ...shippingCompanyDraft, default_charge_inr: e.target.value })} /></label>
                  <label>Minimum delivery days<input type="number" min="0" value={shippingCompanyDraft.estimated_min_days ?? 3} onChange={(e) => setShippingCompanyDraft({ ...shippingCompanyDraft, estimated_min_days: e.target.value })} /></label>
                  <label>Maximum delivery days<input type="number" min="0" value={shippingCompanyDraft.estimated_max_days ?? 7} onChange={(e) => setShippingCompanyDraft({ ...shippingCompanyDraft, estimated_max_days: e.target.value })} /></label>
                  <label className="shipping-toggle"><input type="checkbox" checked={Boolean(shippingCompanyDraft.is_active)} onChange={(e) => setShippingCompanyDraft({ ...shippingCompanyDraft, is_active: e.target.checked })} /> Active for order dispatch</label>
                  <div className="shipping-form-actions"><button type="submit">{shippingCompanyDraft.id ? "UPDATE DELIVERY PARTNER" : "ADD DELIVERY PARTNER"}</button>{shippingCompanyDraft.id && <button type="button" className="secondary" onClick={() => setShippingCompanyDraft({ name: "", tracking_url_template: "", default_charge_inr: 0, estimated_min_days: 3, estimated_max_days: 7, is_active: true })}>CANCEL EDIT</button>}</div>
                </form>
                <div className="shipping-company-list">
                  {shippingCompanies.length ? shippingCompanies.map((company) => <article key={company.id}><div><b>{company.name}</b><small>{company.is_active ? "ACTIVE" : "PAUSED"} · ₹{Number(company.default_charge_inr || 0).toLocaleString("en-IN")} courier charge · {company.estimated_min_days}–{company.estimated_max_days} days</small>{company.tracking_url_template && <small className="tracking-template">{company.tracking_url_template}</small>}</div><div><button type="button" onClick={() => setShippingCompanyDraft(company)}>EDIT</button><button type="button" onClick={() => toggleShippingCompany(company)}>{company.is_active ? "PAUSE" : "ACTIVATE"}</button></div></article>) : <p className="shipping-empty">No delivery partners added yet. Add your courier services above.</p>}
                </div>
              </section>
            </>}
            {shippingTab === "coupons" && <>
            <section style={{ padding: 22, border: "1px solid #e7ddd2", borderRadius: 12, background: "#fffdf9" }}>
              <small style={{ color: "#9a8057", letterSpacing: 2, fontWeight: 800 }}>PROMOTIONS</small>
              <h2 style={{ margin: "7px 0", font: "27px Georgia,serif", color: "#421015" }}>{couponDraft.id ? "Edit Coupon" : "Create Coupon"}</h2>
              <p style={{ color: "#81766d", fontSize: 13 }}>Create percentage or fixed-value offers with minimum order, validity and usage limits.</p>
              <form onSubmit={saveCoupon} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
                <label>Coupon Code<input required maxLength={32} value={couponDraft.code} onChange={(e) => setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase() })} placeholder="e.g. GAURI10" /></label>
                <label>Discount Type<select value={couponDraft.discount_type} onChange={(e) => setCouponDraft({ ...couponDraft, discount_type: e.target.value as "percentage" | "fixed" })}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (₹)</option></select></label>
                <label>Discount Value<input required type="number" min="0.01" step="0.01" value={couponDraft.discount_value} onChange={(e) => setCouponDraft({ ...couponDraft, discount_value: Number(e.target.value) })} /></label>
                <label>Minimum Order (₹)<input type="number" min="0" value={couponDraft.min_order_inr} onChange={(e) => setCouponDraft({ ...couponDraft, min_order_inr: Number(e.target.value) })} /></label>
                <label>Maximum Discount (₹)<input type="number" min="0" value={couponDraft.max_discount_inr ?? ""} onChange={(e) => setCouponDraft({ ...couponDraft, max_discount_inr: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                <label>Usage Limit<input type="number" min="1" value={couponDraft.max_uses ?? ""} onChange={(e) => setCouponDraft({ ...couponDraft, max_uses: e.target.value ? Number(e.target.value) : null })} /></label>
                <label>Starts At<input type="datetime-local" value={couponDraft.starts_at ? new Date(couponDraft.starts_at).toISOString().slice(0,16) : ""} onChange={(e) => setCouponDraft({ ...couponDraft, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label>
                <label>Expires At<input type="datetime-local" value={couponDraft.ends_at ? new Date(couponDraft.ends_at).toISOString().slice(0,16) : ""} onChange={(e) => setCouponDraft({ ...couponDraft, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label>
                <label className="check"><input type="checkbox" checked={couponDraft.is_active} onChange={(e) => setCouponDraft({ ...couponDraft, is_active: e.target.checked })} /> Active</label>
                <label className="check"><input type="checkbox" checked={couponDraft.is_public} onChange={(e) => setCouponDraft({ ...couponDraft, is_public: e.target.checked })} /> Public coupon</label>
                <label className="check"><input type="checkbox" checked={couponDraft.show_on_dashboard} onChange={(e) => setCouponDraft({ ...couponDraft, show_on_dashboard: e.target.checked })} /> Show in customer dashboard</label>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}><button type="submit" style={{ border: 0, borderRadius: 7, background: "#4a111a", color: "#fff", padding: "13px 20px", fontWeight: 800 }}>SAVE COUPON</button><button type="button" onClick={() => setCouponDraft(blankCoupon)} style={{ border: "1px solid #ded1c3", borderRadius: 7, background: "#fff", padding: "13px 18px" }}>CLEAR FORM</button></div>
              </form>
            </section>
            <section style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0, font: "26px Georgia,serif", color: "#421015" }}>Existing Coupons</h2><span style={{ color: "#81766d", fontSize: 12 }}>{coupons.length} coupon(s)</span></div>
              {coupons.length ? coupons.map((c) => <article key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: 16, border: "1px solid #e7ddd2", borderRadius: 10, background: "#fff" }}>
                <div><b style={{ color: "#4a111a", letterSpacing: 1 }}>{c.code}</b><p style={{ margin: "5px 0", color: "#6f6058", fontSize: 12 }}>{c.discount_type === "percentage" ? c.discount_value + "% off" : "₹" + c.discount_value + " off"} · Min. order ₹{Number(c.min_order_inr || 0).toLocaleString("en-IN")} · Used {c.usage_count || 0}{c.max_uses ? " / " + c.max_uses : ""}</p><small style={{ color: "#8a7a70" }}>{c.is_active ? "ACTIVE" : "PAUSED"} · {c.is_public ? "PUBLIC" : "PRIVATE"}</small></div>
                <div style={{ display: "flex", gap: 8 }}><button type="button" onClick={() => setCouponDraft(c)} style={{ border: "1px solid #ded1c3", borderRadius: 6, padding: "9px 13px", background: "#fff" }}>EDIT</button><button type="button" onClick={() => toggleCoupon(c)} style={{ border: 0, borderRadius: 6, padding: "9px 13px", background: c.is_active ? "#f4e8e5" : "#e9f2e9", color: "#4a111a", fontWeight: 800 }}>{c.is_active ? "PAUSE" : "ACTIVATE"}</button><button type="button" onClick={() => deleteCoupon(c)} style={{ border: "1px solid #e6c9c7", borderRadius: 6, padding: "9px 13px", background: "#fff", color: "#9b2d2d", fontWeight: 800 }}>DELETE</button></div>
              </article>) : <p style={{ padding: 20, background: "#fff", border: "1px dashed #d9cbbd", borderRadius: 8, color: "#81766d" }}>No coupons created yet.</p>}
            </section>
            </>}
          </div>
        )}
        {tab === "categories" && (
          <div style={{ display: "grid", gap: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <small style={{ color: "#9a8057", letterSpacing: 2, fontWeight: 700 }}>CATALOGUE ORGANISATION</small>
                <h2 style={{ margin: "6px 0 4px", fontFamily: "Georgia,serif", fontSize: 28, color: "#35251f" }}>Category Management</h2>
                <p style={{ margin: 0, color: "#81766d", fontSize: 13 }}>Manage each homepage collection independently. Your existing categories and product links remain unchanged.</p>
              </div>
              <button onClick={() => setCat({ ...blankCat, collection_type: categoryFilter })} style={{ border: 0, borderRadius: 9, padding: "12px 18px", background: "#4a3025", color: "#fff", fontWeight: 700, cursor: "pointer" }}>＋ Add {categoryFilter === "category" ? "Category" : categoryFilter === "purpose" ? "Purpose" : "Planet"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
              {([
                { key: "category", title: "Shop by Category", hint: "Main categories & subcategories" },
                { key: "purpose", title: "Shop by Purpose", hint: "Customer goals & intentions" },
                { key: "planet", title: "Shop by Planet", hint: "Planetary collections" },
              ] as const).map((item) => {
                const count = cats.filter((c) => (c.collection_type || "category") === item.key).length;
                const activeCount = cats.filter((c) => (c.collection_type || "category") === item.key && c.is_active).length;
                const selected = categoryFilter === item.key;
                return (
                  <button key={item.key} onClick={() => { setCategoryFilter(item.key); setCat({ ...blankCat, collection_type: item.key }); setCategorySearch(""); }}
                    style={{ textAlign: "left", border: selected ? "1px solid #a88955" : "1px solid #e8dfd3", background: selected ? "#f7f0e4" : "#fff", borderRadius: 12, padding: "17px 18px", cursor: "pointer", boxShadow: selected ? "0 5px 18px #6b4d2414" : "none", color: "#35251f" }}>
                    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <b style={{ fontSize: 13 }}>{item.title}</b>
                      <strong style={{ fontFamily: "Georgia,serif", fontSize: 25, color: "#8b6b3f" }}>{count}</strong>
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: "#82766b", marginTop: 5 }}>{item.hint}</span>
                    <span style={{ display: "block", fontSize: 10, color: "#8b6b3f", marginTop: 10, fontWeight: 700 }}>{activeCount} VISIBLE · {count - activeCount} HIDDEN</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) minmax(300px,0.85fr)", gap: 18, alignItems: "start" }}>
              <div style={{ background: "#fff", border: "1px solid #e9e1d7", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: 18, borderBottom: "1px solid #eee7df", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#35251f", fontSize: 17 }}>{categoryFilter === "category" ? "Shop by Category" : categoryFilter === "purpose" ? "Shop by Purpose" : "Shop by Planet"}</h3>
                    <p style={{ margin: "4px 0 0", color: "#8b8178", fontSize: 11 }}>Only this collection is shown below</p>
                  </div>
                  <input value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Search this collection…" style={{ maxWidth: 240, padding: "10px 12px", borderRadius: 8, border: "1px solid #e4dbd0", fontSize: 12 }} />
                </div>
                <div style={{ padding: 12, display: "grid", gap: 8 }}>
                  {cats.filter((c) => (c.collection_type || "category") === categoryFilter && (!categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()) || (c.slug || "").toLowerCase().includes(categorySearch.toLowerCase()))).sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)).map((c) => {
                    const parent = cats.find((p) => p.id === c.parent_id);
                    return (
                      <article key={c.id} style={{ display: "grid", gridTemplateColumns: "52px minmax(0,1fr) auto auto auto", gap: 12, alignItems: "center", padding: 12, border: cat.id === c.id ? "1px solid #b99b68" : "1px solid #f0ebe4", borderRadius: 10, background: cat.id === c.id ? "#fbf7ef" : "#fff" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 9, overflow: "hidden", display: "grid", placeItems: "center", background: "#f5f0e8", color: "#a58a5e", fontSize: 20 }}>{c.image_url ? <img src={c.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "✦"}</div>
                        <div style={{ minWidth: 0 }}>
                          <b style={{ display: "block", color: "#382c25", fontSize: 13 }}>{c.name}</b>
                          <span style={{ display: "block", color: "#92877d", fontSize: 10, marginTop: 4 }}>{categoryFilter === "category" ? (parent ? "↳ Subcategory of " + parent.name : "Main category") : categoryFilter === "purpose" ? "Purpose collection" : "Planet collection"} · {c.is_active ? "Visible on website" : "Hidden"}</span>
                          <span style={{ display: "block", color: "#a39a91", fontSize: 10, marginTop: 3 }}>{c.slug}</span>
                        </div>
                        <button onClick={() => toggleCategoryVisibility(c)} disabled={staffRole !== "admin" && staffRole !== "manager" && !isPrimaryAdmin} style={{ minWidth: 68, border: "1px solid " + (c.is_active ? "#e8c9c5" : "#c9ddcf"), borderRadius: 7, background: c.is_active ? "#fff8f7" : "#f4faf5", color: c.is_active ? "#a34b42" : "#32734a", padding: "8px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{c.is_active ? "Hide" : "Show"}</button>
                        <button onClick={() => { setCat(c); setCategoryFilter(c.collection_type || "category"); }} style={{ border: "1px solid #d9c8ad", borderRadius: 7, background: "#fff", color: "#654d32", padding: "8px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                        <button aria-label={"Delete " + c.name} onClick={() => remove("categories", c.id)} style={{ border: "1px solid #f0d8d4", borderRadius: 7, background: "#fffafa", color: "#a34b42", padding: 8, cursor: "pointer" }}><Trash2 size={15} /></button>
                      </article>
                    );
                  })}
                  {cats.filter((c) => (c.collection_type || "category") === categoryFilter && (!categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()) || (c.slug || "").toLowerCase().includes(categorySearch.toLowerCase()))).length === 0 && (
                    <div style={{ textAlign: "center", padding: "38px 16px", color: "#8b8178" }}><b style={{ display: "block", color: "#51443a", marginBottom: 6 }}>No matching items</b><span style={{ fontSize: 12 }}>Add a new item or change your search.</span></div>
                  )}
                </div>
              </div>
              <div className="editor" style={{ position: "sticky", top: 18 }}>
                <h2 style={{ marginTop: 0 }}>{cat.id ? "Edit " + (cat.collection_type === "purpose" ? "Purpose" : cat.collection_type === "planet" ? "Planet" : "Category") : "Create New " + (categoryFilter === "purpose" ? "Purpose" : categoryFilter === "planet" ? "Planet" : "Category")}</h2>
                <label>
                  Collection Type
                  <select value={cat.collection_type || categoryFilter} onChange={(e) => { const next = e.target.value as "category" | "purpose" | "planet"; setCategoryFilter(next); setCat({ ...cat, collection_type: next, parent_id: "" }); }}>
                    <option value="category">Shop by Category</option>
                    <option value="purpose">Shop by Purpose</option>
                    <option value="planet">Shop by Planet</option>
                  </select>
                </label>
                <label>Name<input value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} placeholder="Enter a clear name" /></label>
                <label>URL Slug<input value={cat.slug} placeholder="Created automatically if blank" onChange={(e) => setCat({ ...cat, slug: e.target.value })} /></label>
                <label>Description<textarea value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} /></label>
                {cat.collection_type === "category" && <label>Parent Category<select value={cat.parent_id || ""} onChange={(e) => setCat({ ...cat, parent_id: e.target.value })}><option value="">None — Main Category</option>{cats.filter((c) => c.id !== cat.id && !c.parent_id && c.collection_type === "category").map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>}
                <label>Display Order<input type="number" value={cat.sort_order} onChange={(e) => setCat({ ...cat, sort_order: e.target.value })} /></label>
                <label>Icon / Photo<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cat")} /></label>
                {cat.image_url && <img className="admin-preview" src={cat.image_url} alt="Category preview" />}
                <label className="check"><input type="checkbox" checked={cat.is_active} onChange={(e) => setCat({ ...cat, is_active: e.target.checked })} /> Visible on website</label>
                <div className="editor-actions"><button onClick={saveCat}><Save /> Save {cat.collection_type === "purpose" ? "Purpose" : cat.collection_type === "planet" ? "Planet" : "Category"}</button><button onClick={() => setCat({ ...blankCat, collection_type: categoryFilter })}>Clear</button></div>
              </div>
            </div>
          </div>
        )}
        {(tab === "products" && catalogView === "products" || tab === "add-product") && (
          <div className="admin-product-workspace">
            {tab === "add-product" && <div className="editor product-editor" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", alignItems: "start", gap: 12, maxWidth: 920, padding: 18 }}>
              <h2 style={{ gridColumn: "1 / -1" }}>{prod.id ? "Edit Product" : "Add New Product"}</h2>
              <label>
                Product Name
                <input
                  value={prod.name}
                  onChange={(e) => setProd({ ...prod, name: e.target.value })}
                />
              </label>
              <label>
                URL Slug
                <input
                  value={prod.slug}
                  placeholder="created automatically"
                  onChange={(e) => setProd({ ...prod, slug: e.target.value })}
                />
              </label>
              <label>
                Short Description
                <input
                  value={prod.short_description || ""}
                  onChange={(e) =>
                    setProd({ ...prod, short_description: e.target.value })
                  }
                />
              </label>
              <label>
                Full Description
                <textarea
                  value={prod.description || ""}
                  onChange={(e) =>
                    setProd({ ...prod, description: e.target.value })
                  }
                />
              </label>
              <details className="product-extra-fields" style={{ gridColumn: "1 / -1" }}>
                <summary>Gemstone & product specifications <span>Optional product details</span></summary>
                <div className="product-extra-grid">
                  <label>SKU / Product Code<input value={prod.sku || ""} placeholder="Enter unique stock code" onChange={(e) => setProd({ ...prod, sku: e.target.value })} /></label>
                  <label>Product Type<input value={prod.product_type || ""} placeholder="Gemstone, bracelet, pooja service…" onChange={(e) => setProd({ ...prod, product_type: e.target.value })} /></label>
                  <label>Gemstone Name<input value={prod.gemstone_name || ""} onChange={(e) => setProd({ ...prod, gemstone_name: e.target.value })} /></label>
                  <label>Material<input value={prod.material || ""} onChange={(e) => setProd({ ...prod, material: e.target.value })} /></label>
                  <label>Natural / Lab Status<select value={prod.natural_lab_status || ""} onChange={(e) => setProd({ ...prod, natural_lab_status: e.target.value })}><option value="">Not specified</option><option value="Natural">Natural</option><option value="Lab Grown">Lab Grown</option><option value="Synthetic">Synthetic</option><option value="Not Applicable">Not Applicable</option></select></label>
                  <label>Origin<input value={prod.origin || ""} onChange={(e) => setProd({ ...prod, origin: e.target.value })} /></label>
                  <label>Treatment<input value={prod.treatment || ""} onChange={(e) => setProd({ ...prod, treatment: e.target.value })} /></label>
                  <label>Certification / Lab<input value={prod.certification || ""} onChange={(e) => setProd({ ...prod, certification: e.target.value })} /></label>
                  <label>Shape<input value={prod.shape || ""} onChange={(e) => setProd({ ...prod, shape: e.target.value })} /></label>
                  <label>Colour<input value={prod.color || ""} onChange={(e) => setProd({ ...prod, color: e.target.value })} /></label>
                  <label>Weight (grams)<input type="number" min="0" step="0.001" value={prod.weight_grams ?? ""} onChange={(e) => setProd({ ...prod, weight_grams: e.target.value === "" ? null : e.target.value })} /></label>
                  <label>Carat Weight<input type="number" min="0" step="0.01" value={prod.carat_weight ?? ""} onChange={(e) => setProd({ ...prod, carat_weight: e.target.value === "" ? null : e.target.value })} /></label>
                </div>
                <label className="check"><input type="checkbox" checked={Boolean(prod.is_one_of_one)} onChange={(e) => setProd({ ...prod, is_one_of_one: e.target.checked })} /> One-of-one / unique piece</label>
              </details>
              <details className="product-extra-fields" style={{ gridColumn: "1 / -1" }}>
                <summary>Certificate & product care <span>Customer-facing options</span></summary>
                <div className="product-extra-grid">
                  <label className="check"><input type="checkbox" checked={Boolean(prod.certificate_available)} onChange={(e) => setProd({ ...prod, certificate_available: e.target.checked })} /> Certificate available</label>
                  {prod.certificate_available && <label>Certificate price (₹)<input type="number" min="0" step="1" value={prod.certificate_price_inr ?? 0} onChange={(e) => setProd({ ...prod, certificate_price_inr: e.target.value })} /></label>}
                  <label className="check"><input type="checkbox" checked={Boolean(prod.abhimantrit_available)} onChange={(e) => setProd({ ...prod, abhimantrit_available: e.target.checked })} /> Abhimantrit option available</label>
                  <label style={{ gridColumn: "1 / -1" }}>Care Instructions<textarea value={prod.care_instructions || ""} onChange={(e) => setProd({ ...prod, care_instructions: e.target.value })} /></label>
                  <label>Delivery Notes<textarea value={prod.delivery_notes || ""} onChange={(e) => setProd({ ...prod, delivery_notes: e.target.value })} /></label>
                  <label>Return Notes<textarea value={prod.return_notes || ""} onChange={(e) => setProd({ ...prod, return_notes: e.target.value })} /></label>
                </div>
              </details>
              <details className="product-extra-fields" style={{ gridColumn: "1 / -1" }}>
                <summary>Search & Google listing <span>Optional discoverability settings</span></summary>
                <div className="product-extra-grid">
                  <label>SEO Title<input value={prod.seo_title || ""} onChange={(e) => setProd({ ...prod, seo_title: e.target.value })} /></label>
                  <label>Google Product Category<input value={prod.google_product_category || ""} onChange={(e) => setProd({ ...prod, google_product_category: e.target.value })} /></label>
                  <label style={{ gridColumn: "1 / -1" }}>SEO Description<textarea value={prod.seo_description || ""} onChange={(e) => setProd({ ...prod, seo_description: e.target.value })} /></label>
                </div>
              </details>
              <div className="two">
                <label>
                  Selling Price ₹
                  <input
                    type="number"
                    value={prod.price_inr}
                    onChange={(e) =>
                      setProd({ ...prod, price_inr: e.target.value })
                    }
                  />
                </label>
                <label>
                  MRP ₹
                  <input
                    type="number"
                    value={prod.compare_at_price_inr || ""}
                    onChange={(e) =>
                      setProd({ ...prod, compare_at_price_inr: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="two">
                <label>
                  Stock Quantity
                  <input
                    type="number"
                    value={prod.stock_quantity}
                    onChange={(e) =>
                      setProd({ ...prod, stock_quantity: e.target.value })
                    }
                  />
                </label>
                <label>
                  Badge
                  <select
                    value={prod.badge || ""}
                    onChange={(e) =>
                      setProd({ ...prod, badge: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    <option value="new">New Arrival</option>
                    <option value="bestseller">Best Seller</option>
                    <option value="one-of-one">One of One</option>
                    <option value="gift">Unique Gift</option>
                  </select>
                </label>
              </div>
              <section className="product-collection-picker" style={{ gridColumn: "1 / -1", border: "1px solid #e8ded3", borderRadius: 11, padding: 13, background: "#fffdf9", display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div><b style={{ display: "block", color: "#402126", fontSize: 14 }}>Product placement</b><small style={{ color: "#817168" }}>Choose the categories, purposes and planets where this product should appear.</small></div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#72513d", background: "#f4eadb", borderRadius: 20, padding: "5px 9px" }}>{(Array.isArray(prod.category_ids) ? prod.category_ids : []).filter((id: string) => cats.some((c) => c.id === id)).length} selected</span>
                </div>
                {(() => {
                  const selectedIds = Array.from(new Set([...(Array.isArray(prod.category_ids) ? prod.category_ids : []), ...(prod.category_id ? [prod.category_id] : [])]));
                  const updateCollection = (kind: "category" | "purpose" | "planet", id: string, checked: boolean) => {
                    const current = Array.from(new Set([...(Array.isArray(prod.category_ids) ? prod.category_ids : []), ...(prod.category_id ? [prod.category_id] : [])]));
                    const nextIds = checked ? Array.from(new Set([...current, id])) : current.filter((item: string) => item !== id);
                    const categoryIds = nextIds.filter((item: string) => cats.some((cat) => cat.id === item && cat.collection_type === "category"));
                    setProd({ ...prod, category_ids: nextIds, category_id: kind === "category" ? (checked ? (prod.category_id || id) : (prod.category_id === id ? (categoryIds[0] || "") : prod.category_id)) : (prod.category_id || categoryIds[0] || "") });
                  };
                  const categoryChoices = cats.filter((c) => c.is_active && c.collection_type === "category" && !/^(chakra|zodiac)$/i.test(c.name.trim()) && (!collectionSearch || c.name.toLowerCase().includes(collectionSearch.toLowerCase())));
                  const renderCollectionSelector = (kind: "category" | "purpose" | "planet", title: string) => {
                    const choices = cats.filter((c) => c.is_active && c.collection_type === kind && !/^(chakra|zodiac)$/i.test(c.name.trim()) && (!collectionSearch || c.name.toLowerCase().includes(collectionSearch.toLowerCase())));
                    const selectedCount = selectedIds.filter((id) => choices.some((c) => c.id === id)).length;
                    return <details key={kind} className="product-collection-dropdown" style={{ border: "1px solid #e5d9cc", borderRadius: 9, background: "#fff", minWidth: 0 }}>
                      <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 14px", cursor: "pointer", listStyle: "none", color: "#402126", fontWeight: 750 }}>
                        <span>{title}</span><span style={{ color: "#806d60", fontSize: 12, fontWeight: 650 }}>{selectedCount ? selectedCount + " selected" : "Select"}　⌄</span>
                      </summary>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, padding: "4px 14px 14px", borderTop: "1px solid #f0e8df" }}>
                        {choices.map((c) => <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, padding: "7px 8px", borderRadius: 6, background: selectedIds.includes(c.id) ? "#f8f0e7" : "#fff", color: "#493a33", fontSize: 13 }}>
                          <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={(e) => updateCollection(kind, c.id, e.target.checked)} /><span>{c.name}</span>
                        </label>)}
                        {!choices.length && <small style={{ color: "#817168" }}>No active options available.</small>}
                      </div>
                    </details>;
                  };
                  return <div className="product-placement-controls" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
                    {renderCollectionSelector("category", "Shop by Category")}
                    {renderCollectionSelector("purpose", "Shop by Purpose")}
                    {renderCollectionSelector("planet", "Shop by Planet")}
                  </div>;
                })()}
              </section>
              <section style={{ gridColumn: "1 / -1", border: "1px solid #e8ded3", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div><b style={{ color: "#402126", fontSize: 13 }}>Delivery charges</b><small style={{ display: "block", color: "#817168", marginTop: 3 }}>Enable this only when this product should carry a delivery fee.</small></div>
                  <label className="check" style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}><input type="checkbox" checked={Boolean(prod.custom_shipping_enabled)} onChange={(e) => setProd({ ...prod, custom_shipping_enabled: e.target.checked, custom_shipping_charge_inr: e.target.checked ? (prod.custom_shipping_charge_inr ?? "") : null })} /> Apply delivery charge</label>
                </div>
                {prod.custom_shipping_enabled && <label style={{ display: "grid", gap: 5, maxWidth: 260, marginTop: 10 }}>Product delivery charge (₹)<input type="number" min="0" step="1" value={prod.custom_shipping_charge_inr ?? ""} onChange={(e) => setProd({ ...prod, custom_shipping_charge_inr: e.target.value })} placeholder="Leave blank to use standard courier rate" /></label>}
              </section>
              <label>
                Main Product Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && upload(e.target.files[0], "prod")
                  }
                />
              </label>
              {prod.primary_image_url && (
                <img className="admin-preview" src={prod.primary_image_url} />
              )}
              <label>
                Additional Product Images (select many)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    e.target.files && uploadGallery(e.target.files)
                  }
                />
              </label>
              {prod.image_urls?.length > 0 && (
                <div className="admin-gallery admin-gallery-compact">
                  {prod.image_urls.map((url: string, i: number) => (
                    <div key={url}>
                      <img src={url} />
                      <button
                        onClick={() =>
                          setProd({
                            ...prod,
                            image_urls: prod.image_urls.filter(
                              (_: string, x: number) => x !== i,
                            ),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={prod.is_featured}
                  onChange={(e) =>
                    setProd({ ...prod, is_featured: e.target.checked })
                  }
                />{" "}
                Top Pick / Featured
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={prod.is_active}
                  onChange={(e) =>
                    setProd({ ...prod, is_active: e.target.checked })
                  }
                />{" "}
                Visible on website
              </label>
              <div className="editor-actions product-save-actions">
                <button onClick={saveProd}>
                  <Save />
                  Save Product
                </button>
                <button onClick={() => setProd(blankProd)}>Clear</button>
              </div>
              <div className="bottom-save-product">
                <span>{prod.image_urls?.length || 0} additional image(s) attached</span>
                <button onClick={saveProd}><Save /> SAVE PRODUCT</button>
              </div>
            </div>}
            {tab === "products" && catalogView === "products" && <div className="records product-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", alignItems: "stretch", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 4 }}>
                <select aria-label="Filter products by category" value={selectedProductCategory} onChange={(e) => { setSelectedProductCategory(e.target.value); setProductPage(1); }} style={{ flex: "0 1 210px", minWidth: 160 }}><option value="all">All Categories · All Products</option>{cats.filter((c) => c.collection_type === "category").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <input aria-label="Search products" placeholder="Search products by name…" value={productQuery} onChange={(e) => { setProductQuery(e.target.value); setProductPage(1); }} style={{ flex: "1 1 220px", minWidth: 180 }} />
                <select aria-label="Filter products" value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setProductPage(1); }} style={{ flex: "0 1 170px" }}><option value="all">All products</option><option value="active">Visible</option><option value="hidden">Hidden</option><option value="low-stock">Low stock (3 or less)</option><option value="out-of-stock">Out of stock</option></select>
                <select aria-label="Sort products" value={productSort} onChange={(e) => { setProductSort(e.target.value); setProductPage(1); }} style={{ flex: "0 1 170px" }}><option value="newest">Newest first</option><option value="name-asc">Name A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="stock-low">Stock: low to high</option><option value="stock-high">Stock: high to low</option></select>
                <small style={{ color: "#806f68" }}>{sortedProducts.length} of {products.length} products</small>
              </div>
              {sortedProducts.length > 0 && paginationControls(sortedProducts.length)}
              {sortedProducts.length ? (
                paginatedProducts.map((p) => (
                  <article key={p.id} className="product-admin-card">
                    <div className="product-admin-card-head">
                      <img src={adminThumbnail(p.primary_image_url, 160)} onError={(e) => { const img = e.currentTarget; if (img.src !== (p.primary_image_url || "/placeholder.png")) img.src = p.primary_image_url || "/placeholder.png"; }} loading="lazy" decoding="async" fetchPriority="low" alt="" />
                      <div className="product-admin-card-title">
                        <b title={p.name}>{p.name}</b>
                        <span className={p.is_active ? "product-status-visible" : "product-status-hidden"}>{p.is_active ? "Visible on store" : "Hidden from store"}</span>
                      </div>
                    </div>
                    <div className="product-admin-card-meta">
                      {quickEdit?.id === p.id && quickEdit.field === "price_inr" ? <input autoFocus aria-label={"Edit price for " + p.name} type="number" min="0" step="1" value={quickEdit.value} onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })} onBlur={() => saveQuickProductField(p.id, "price_inr", quickEdit.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.preventDefault(); e.currentTarget.onblur = null; setQuickEdit(null); } }} /> : <button type="button" title="Click to edit price" onClick={() => setQuickEdit({ id: p.id, field: "price_inr", value: String(p.price_inr) })}>₹{Number(p.price_inr).toLocaleString("en-IN")} <small>✎</small></button>}
                      <span className="product-stock-label">Stock</span>
                      {quickEdit?.id === p.id && quickEdit.field === "stock_quantity" ? <input autoFocus aria-label={"Edit stock for " + p.name} type="number" min="0" step="1" value={quickEdit.value} onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })} onBlur={() => saveQuickProductField(p.id, "stock_quantity", quickEdit.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.preventDefault(); e.currentTarget.onblur = null; setQuickEdit(null); } }} /> : <button type="button" title="Click to edit stock" onClick={() => setQuickEdit({ id: p.id, field: "stock_quantity", value: String(p.stock_quantity) })}>{p.stock_quantity} <small>✎</small></button>}
                      <small>{p.image_urls?.length || 0} extra photos</small>
                    </div>
                    <div className="product-admin-card-actions">
                      <button className="product-edit-action" onClick={() => { setProd(p); setTab("add-product"); }}>Edit</button>
                      <button className={p.is_active ? "product-hide-button" : "product-show-button"} onClick={() => toggleProductVisibility(p)}>{p.is_active ? "Hide" : "Show"}</button>
                      <button className="product-delete-icon" aria-label={"Delete " + p.name} title="Delete product" onClick={() => remove("products", p.id)}><Trash2 /></button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="admin-empty">
                  <Package />
                  <h3>No products yet</h3>
                  <p>
                    Add your first product using the form. Nothing is
                    pre-listed.
                  </p>
                </div>
              )}
              {sortedProducts.length > 0 && paginationControls(sortedProducts.length)}
            </div>}
          </div>
        )}
        {tab === "products" && catalogView === "inventory" && (
          <div className="inventory-admin">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div><h2 style={{ margin: 0, font: "28px Georgia,serif", color: "#421015" }}>Inventory Overview</h2><small style={{ color: "#806f68" }}>Update stock directly here. Changes save to your product inventory.</small></div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ background: "#fff", border: "1px solid #e2d7cc", padding: "9px 12px", borderRadius: 8 }}>{products.length} total products</span>
                <span style={{ background: "#fff4e5", border: "1px solid #efd4a9", padding: "9px 12px", borderRadius: 8 }}>{lowStock} low stock (3 or less)</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <select aria-label="Filter stock by category" value={selectedProductCategory} onChange={(e) => { setSelectedProductCategory(e.target.value); setProductPage(1); }} style={{ padding: 12, border: "1px solid #d8cbc0", background: "#fff", minWidth: 190 }}><option value="all">All Categories · All Stock</option>{cats.filter((c) => c.collection_type === "category").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input aria-label="Search inventory" placeholder="Search inventory by product name…" value={productQuery} onChange={(e) => { setProductQuery(e.target.value); setProductPage(1); }} style={{ flex: "1 1 260px", minWidth: 180, padding: 12, border: "1px solid #d8cbc0", background: "#fff" }} />
              <select aria-label="Filter inventory" value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setProductPage(1); }} style={{ padding: 12, border: "1px solid #d8cbc0", background: "#fff" }}><option value="all">All products</option><option value="active">Visible</option><option value="hidden">Hidden</option><option value="low-stock">Low stock (3 or less)</option><option value="out-of-stock">Out of stock</option></select>
              <select aria-label="Sort inventory" value={productSort} onChange={(e) => { setProductSort(e.target.value); setProductPage(1); }} style={{ padding: 12, border: "1px solid #d8cbc0", background: "#fff" }}><option value="newest">Newest first</option><option value="name-asc">Name A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="stock-low">Stock: low to high</option><option value="stock-high">Stock: high to low</option></select>
            </div>
            {sortedProducts.length > 0 && paginationControls(sortedProducts.length)}
            <div style={{ background: "#fff", border: "1px solid #e2d7cc", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                <thead><tr style={{ background: "#f8f2eb", textAlign: "left" }}><th style={{ padding: 13 }}>Product</th><th style={{ padding: 13 }}>Price</th><th style={{ padding: 13 }}>Available stock</th><th style={{ padding: 13 }}>Status</th><th style={{ padding: 13 }}>Action</th></tr></thead>
                <tbody>
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #eee5dc" }}>
                      <td style={{ padding: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}><img src={adminThumbnail(p.primary_image_url, 112)} onError={(e) => { const img = e.currentTarget; if (img.src !== (p.primary_image_url || "/placeholder.png")) img.src = p.primary_image_url || "/placeholder.png"; }} loading="lazy" decoding="async" fetchPriority="low" alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6, background: "#f3eee8" }} /><b>{p.name}</b></div></td>
                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>₹{Number(p.price_inr).toLocaleString("en-IN")}</td>
                      <td style={{ padding: 10 }}>{quickEdit?.id === p.id && quickEdit.field === "stock_quantity" ? <input autoFocus aria-label={"Edit stock for " + p.name} type="number" min="0" step="1" value={quickEdit.value} onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })} onBlur={() => saveQuickProductField(p.id, "stock_quantity", quickEdit.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.preventDefault(); e.currentTarget.onblur = null; setQuickEdit(null); } }} style={{ width: 90, padding: 8, border: "1px solid #d8c5ae" }} /> : <button type="button" onClick={() => setQuickEdit({ id: p.id, field: "stock_quantity", value: String(p.stock_quantity) })} style={{ border: "1px solid #d8c5ae", borderRadius: 7, padding: "8px 12px", background: Number(p.stock_quantity) <= 3 ? "#fff4e5" : "#fff", color: "#4b3529", fontWeight: 700 }}>{p.stock_quantity} ✎</button>}</td>
                      <td style={{ padding: 10 }}><span style={{ color: !p.is_active ? "#806f68" : Number(p.stock_quantity) <= 3 ? "#a45b00" : "#267347", fontWeight: 700 }}>{!p.is_active ? "Hidden" : Number(p.stock_quantity) <= 3 ? "Low stock" : "In stock"}</span></td>
                      <td style={{ padding: 10 }}><button onClick={() => { setProd(p); setTab("add-product"); }} style={{ border: "1px solid #d8c5ae", padding: "8px 11px", background: "#fff" }}>Edit product</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredProducts.length && <p style={{ padding: 24 }}>No products match these filters.</p>}
            </div>
            {filteredProducts.length > 0 && paginationControls(filteredProducts.length)}
          </div>
        )}
        {tab === "reviews" && (
          <div className="review-admin">
            {reviews.length ? (
              reviews.map((r) => (
                <article key={r.id}>
                  <div className="review-stars">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                  <small>
                    {r.reviewer_name} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN")} ·{" "}
                    {products.find((p) => p.id === r.product_id)?.name ||
                      "Product"}
                  </small>
                  <div>
                    <button
                      onClick={() => moderateReview(r.id, !r.is_approved)}
                    >
                      {r.is_approved ? "HIDE REVIEW" : "APPROVE REVIEW"}
                    </button>
                    <button
                      className="delete"
                      onClick={() => remove("product_reviews", r.id)}
                    >
                      <Trash2 /> DELETE
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-empty">
                <Star />
                <h3>No customer reviews yet</h3>
                <p>New reviews will appear here for your approval.</p>
              </div>
            )}
          </div>
        )}
        {tab === "astrology" && ["admin", "manager", "support"].includes(staffRole) && (
          <div className="astrology-admin" style={{display:"grid",gap:22}}>
            <section style={{background:"#fff",border:"1px solid #eadfce",borderRadius:14,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div><h2 style={{margin:"0 0 6px"}}>Consultation enquiries</h2><p style={{margin:0,color:"#75675e"}}>Customer requests submitted from the website appear here automatically.</p></div>
                <button type="button" onClick={()=>loadAstrology()} style={{padding:"10px 14px",borderRadius:8,border:"1px solid #d8c8a8",background:"#fffdf8",fontWeight:700}}>Refresh enquiries</button>
              </div>
              <div style={{display:"grid",gap:12,marginTop:18}}>
                {astrologyEnquiries.length ? astrologyEnquiries.map(enquiry=>(
                  <article key={enquiry.id} style={{border:"1px solid #e9dfd1",borderRadius:12,padding:16,background:"#fffdf8"}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                      <div><h3 style={{margin:"0 0 5px",color:"#401016"}}>{enquiry.full_name}</h3><small style={{color:"#75675e"}}>{new Date(enquiry.created_at).toLocaleString("en-IN")} · {enquiry.service}</small></div>
                      <select aria-label={`Status for ${enquiry.full_name}`} value={enquiry.status} onChange={e=>updateAstrologyStatus(enquiry.id,e.target.value)} style={{padding:"8px 10px",border:"1px solid #d8c8a8",borderRadius:8,background:"#fff",color:"#35252a"}}>
                        <option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="closed">Closed</option>
                      </select>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,marginTop:12,color:"#403632",fontSize:14}}>
                      <div><b>Mobile:</b> {enquiry.mobile}</div><div><b>Email:</b> <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></div><div style={{gridColumn:"1 / -1"}}><b>Address:</b> {enquiry.address}</div>
                      {enquiry.preferred_time&&<div><b>Preferred time:</b> {enquiry.preferred_time}</div>}
                      {enquiry.details&&<div style={{gridColumn:"1 / -1"}}><b>Details:</b> {enquiry.details}</div>}
                      <div><b>Email notification:</b> {enquiry.email_status==="sent"?"Sent":enquiry.email_status==="not_configured"?"Not configured":enquiry.email_status==="failed"?"Failed":"Pending"}</div>
                    </div>
                  </article>
                )) : <div className="admin-empty"><Star /><h3>No astrology enquiries yet</h3><p>New customer enquiries will be listed here.</p></div>}
              </div>
            </section>
            {isPrimaryAdmin && <section style={{background:"#fff",border:"1px solid #eadfce",borderRadius:14,padding:20}}>
              <h2 style={{margin:"0 0 6px"}}>Consultation services</h2><p style={{margin:"0 0 16px",color:"#75675e"}}>Add, rename, describe or temporarily hide services displayed on the website enquiry page.</p>
              <div style={{display:"grid",gap:12}}>
                {astrologyServices.map((service,index)=><article key={index} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) minmax(220px,2fr) auto auto",gap:10,alignItems:"center",padding:12,border:"1px solid #eee4d7",borderRadius:10}}>
                  <input aria-label="Service name" value={service.name} onChange={e=>setAstrologyServices(old=>old.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="Service name" style={{padding:10,border:"1px solid #d8c8a8",borderRadius:7,minWidth:0}}/>
                  <input aria-label="Service description" value={service.description} onChange={e=>setAstrologyServices(old=>old.map((x,i)=>i===index?{...x,description:e.target.value}:x))} placeholder="Short description" style={{padding:10,border:"1px solid #d8c8a8",borderRadius:7,minWidth:0}}/>
                  <label style={{display:"flex",gap:6,alignItems:"center",fontSize:13}}><input type="checkbox" checked={service.active} onChange={e=>setAstrologyServices(old=>old.map((x,i)=>i===index?{...x,active:e.target.checked}:x))}/> Visible</label>
                  <button type="button" onClick={()=>setAstrologyServices(old=>old.filter((_,i)=>i!==index))} style={{border:0,background:"transparent",color:"#8b1c27",fontWeight:700}}>Remove</button>
                </article>)}
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" disabled={astrologyServices.length>=20} onClick={()=>setAstrologyServices(old=>[...old,{name:"",description:"",active:true}])} style={{padding:"10px 14px",border:"1px solid #d8c8a8",borderRadius:8,background:"#fffdf8",fontWeight:700}}>+ Add service</button><button type="button" onClick={saveAstrologyServices} style={{padding:"10px 16px",border:0,borderRadius:8,background:"#741923",color:"#fff",fontWeight:800}}>Save consultation services</button></div>
              </div>
            </section>}
          </div>
        )}
        {tab === "staff" && isPrimaryAdmin && (
          <div className="staff-admin">
            <section className="staff-intro"><ShieldCheck /><div><h2>Main administrator controls</h2><p>Invite staff by email and grant only the access they need. Only the main admin can invite or revoke staff and delete customer/order records.</p></div></section>
            <form className="staff-invite-form" onSubmit={inviteStaff}>
              <h2><UserPlus /> Invite staff member</h2>
              {!adminServiceConfigured && <p className="staff-config-warning" role="status">Preview mode: invitation sending is disabled because the server-only admin key is not configured here. For security, the Production key is not copied into Preview. The form will become active in a deployment with the secure server configuration.</p>}
              <label>Staff email<input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="staff@example.com" required disabled={!adminServiceConfigured} /></label>
              <label>Access role<select value={staffInviteRole} onChange={(e) => setStaffInviteRole(e.target.value)} disabled={!adminServiceConfigured}><option value="orders">Orders & fulfilment</option><option value="support">Customer support</option><option value="catalog">Products & catalogue</option><option value="manager">Store manager</option><option value="admin">Administrator</option></select></label>
              <button type="submit" disabled={!adminServiceConfigured}><UserPlus /> {adminServiceConfigured ? "SEND SECURE INVITATION" : "INVITATIONS UNAVAILABLE IN PREVIEW"}</button>
            </form>
            <section className="staff-list"><h2>Team access</h2>{!adminServiceConfigured ? <p>Team members cannot be listed in this Preview because it has no server-only admin key. This does not change or expose Production data.</p> : staffRows.length ? staffRows.map((member) => <article key={member.user_id}><div><b>{member.email}</b><small>{member.user_id === "42dcd32a-2ec6-406c-8be3-703237a33d0d" ? "Primary main administrator" : ({admin:"Administrator",manager:"Store manager",orders:"Orders & fulfilment",support:"Customer support",catalog:"Products & catalogue"} as Record<string,string>)[member.role] || member.role} · Added {new Date(member.created_at).toLocaleDateString("en-IN")}</small></div>{member.user_id !== "42dcd32a-2ec6-406c-8be3-703237a33d0d" && <button onClick={() => removeStaff(member.user_id)}><UserX /> Revoke access</button>}</article>) : <p>No staff members yet. Invite your first staff member above.</p>}</section>
          </div>
        )}
        {tab === "settings" && staffRole === "admin" && settings && (
          <div className="editor settings">
            <h2>Edit Website Content & Brand Images</h2>
            <div className="settings-field">
              <label htmlFor="catalog-page-size">Products shown per page</label>
              <select
                id="catalog-page-size"
                value={Number(settings.catalog_page_size || 12)}
                onChange={(e) => setSettings({ ...settings, catalog_page_size: Number(e.target.value) })}
              >
                {[8, 12, 16, 20, 24, 32, 40, 48].map((count) => (
                  <option key={count} value={count}>{count} products</option>
                ))}
              </select>
              <small>Choose how many products customers see on each catalogue page. This applies to desktop and mobile.</small>
            </div>
            <label>
              Main Shree Gauri Logo
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadSetting(e.target.files[0], "brand_logo_url")
                }
              />
            </label>
            {settings.brand_logo_url && (
              <img
                className="admin-preview logo-preview"
                src={settings.brand_logo_url}
              />
            )}
            <label>
              Top Announcement
              <input
                value={settings.announcement}
                onChange={(e) =>
                  setSettings({ ...settings, announcement: e.target.value })
                }
              />
            </label>
            <label>
              Hero Heading
              <input
                value={settings.hero_title}
                onChange={(e) =>
                  setSettings({ ...settings, hero_title: e.target.value })
                }
              />
            </label>
            <label>
              Hero Text
              <textarea
                value={settings.hero_text}
                onChange={(e) =>
                  setSettings({ ...settings, hero_text: e.target.value })
                }
              />
            </label>
            <label>
              Hero Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadSetting(e.target.files[0], "hero_image_url")
                }
              />
            </label>
            {settings.hero_image_url && (
              <img className="admin-preview" src={settings.hero_image_url} />
            )}
            <label>
              Hero Image URL
              <input
                value={settings.hero_image_url}
                onChange={(e) =>
                  setSettings({ ...settings, hero_image_url: e.target.value })
                }
              />
            </label>
            <label>
              Founder Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadSetting(e.target.files[0], "founder_image_url")
                }
              />
            </label>
            {settings.founder_image_url && (
              <img className="admin-preview" src={settings.founder_image_url} />
            )}
            <label>
              Founder Name
              <input
                value={settings.founder_name}
                onChange={(e) =>
                  setSettings({ ...settings, founder_name: e.target.value })
                }
              />
            </label>
            <label>
              Founder Message
              <textarea
                rows={6}
                value={settings.founder_message}
                onChange={(e) =>
                  setSettings({ ...settings, founder_message: e.target.value })
                }
              />
            </label>
            <div className="two">
              <label>
                WhatsApp Number
                <input
                  value={settings.whatsapp}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsapp: e.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Instagram Link
              <input
                value={settings.instagram}
                onChange={(e) =>
                  setSettings({ ...settings, instagram: e.target.value })
                }
              />
            </label>
            <label>
              Facebook Link
              <input
                value={settings.facebook}
                onChange={(e) =>
                  setSettings({ ...settings, facebook: e.target.value })
                }
              />
            </label>
            <button className="save-settings" onClick={saveSettings}>
              <Save />
              SAVE ALL WEBSITE SETTINGS
            </button>
          </div>
        )}
        {tab === "currency" && isPrimaryAdmin && settings && (
          <div className="editor settings currency-settings">
            <h2>Global Currency Conversion Rates</h2>
            <p>INR is the base price. Set how much one Indian rupee equals in each currency. Storefront display conversions use these rates; order records and accounting remain in INR.</p>
            <div className="currency-rate-grid">
              {["INR","USD","EUR","GBP","AED","CAD","AUD","SGD","JPY","CHF","NZD","SAR","QAR","KWD","BHD","OMR","MYR","THB","IDR","PHP","VND","ZAR","MUR","NPR","LKR","BDT","KRW","SEK","NOK","DKK","PLN","HKD"].map((code) => {
                const defaults: Record<string, number> = {INR:1,USD:.012,EUR:.010,GBP:.009,AED:.044,CAD:.016,AUD:.018,SGD:.015,JPY:1.75,CHF:.0095,NZD:.020,SAR:.045,QAR:.044,KWD:.0037,BHD:.0045,OMR:.0046,MYR:.051,THB:.38,IDR:190,PHP:.68,VND:315,ZAR:.21,MUR:.55,NPR:1.60,LKR:3.65,BDT:1.46,KRW:16.5,SEK:.112,NOK:.118,DKK:.069,PLN:.043,HKD:.093};
                const rates = { ...defaults, ...(settings.currency_rates || {}) };
                return <label key={code}>{code}{code === "INR" ? " (Base)" : ""}
                  <input type="number" min="0" step="0.000001" disabled={code === "INR"} value={rates[code] ?? ""} onChange={(e) => setSettings({ ...settings, currency_rates: { ...rates, [code]: Number(e.target.value) } })} />
                </label>;
              })}
            </div>
            <button className="save-settings" onClick={saveSettings}><Save /> SAVE CURRENCY RATES</button>
          </div>
        )}
      </section>
    </main>
  );
}
