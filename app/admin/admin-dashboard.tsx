"use client";
import { FormEvent, useEffect, useState } from "react";
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
} from "lucide-react";
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
  name: "",
  slug: "",
  short_description: "",
  description: "",
  price_inr: 0,
  compare_at_price_inr: null,
  stock_quantity: 0,
  category_id: "",
  primary_image_url: "",
  image_urls: [] as string[],
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
    [tab, setTab] = useState("dashboard"),
    [cats, setCats] = useState<Cat[]>([]),
    [products, setProducts] = useState<Prod[]>([]),
    [reviews, setReviews] = useState<Review[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [settings, setSettings] = useState<any>(null),
    [cat, setCat] = useState<any>(blankCat),
    [prod, setProd] = useState<any>(blankProd),
    [notice, setNotice] = useState(""),
    [lastSeenActivity, setLastSeenActivity] = useState(0),
    [staffRole, setStaffRole] = useState<string>("loading"),
    [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false),
    [adminServiceConfigured, setAdminServiceConfigured] = useState(true),
    [staffRows, setStaffRows] = useState<any[]>([]),
    [staffEmail, setStaffEmail] = useState(""),
    [staffInviteRole, setStaffInviteRole] = useState("orders"),
    [needsPasswordSetup, setNeedsPasswordSetup] = useState(false),
    [newStaffPassword, setNewStaffPassword] = useState(""),
    [quickEdit, setQuickEdit] = useState<{ id: string; field: "price_inr" | "stock_quantity"; value: string } | null>(null),
    [productQuery, setProductQuery] = useState(""),
    [productFilter, setProductFilter] = useState("all");
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
  async function load() {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return;
    const roleResponse = await fetch("/api/admin/manage", { headers: { Authorization: `Bearer ${currentSession.access_token}` } });
    const roleData = await roleResponse.json().catch(() => ({}));
    if (!roleResponse.ok) { setStaffRole("unauthorized"); setNotice(roleData.error || "Admin access could not be verified."); return; }
    setStaffRole(roleData.role);
    setIsPrimaryAdmin(Boolean(roleData.is_primary_admin));
    setAdminServiceConfigured(roleData.service_configured !== false);
    setStaffRows(roleData.staff || []);
    setNeedsPasswordSetup(Boolean(roleData.needs_password_setup));
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
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError || !data.session) {
      setError(signInError?.message || "Unable to start a secure session. Please try again.");
      return;
    }
    const roleResponse = await fetch("/api/admin/manage", {
      headers: { Authorization: "Bearer " + data.session.access_token },
    });
    const roleData = await roleResponse.json().catch(() => ({}));
    const isMainAdmin = roleResponse.ok && roleData.is_primary_admin === true;
    const isStaff = roleResponse.ok && roleData.is_primary_admin !== true && ["admin", "manager", "orders", "support", "catalog"].includes(roleData.role);
    if ((loginMode === "admin" && !isMainAdmin) || (loginMode === "staff" && !isStaff)) {
      await supabase.auth.signOut();
      setError(loginMode === "admin"
        ? "This work email is not assigned to the main administrator account. Choose Staff Login if you have staff access."
        : "This work email does not have an active staff role. Ask the main administrator to invite or enable your access.");
    }
  }
  async function runAdminAction(action: string, payload: Record<string, unknown> = {}) {
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
  async function saveCat() {
    const data = {
      ...cat,
      slug:
        cat.slug ||
        cat.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      parent_id: cat.parent_id || null,
      sort_order: Number(cat.sort_order),
    };
    const r = cat.id
      ? await supabase.from("categories").update(data).eq("id", cat.id)
      : await supabase.from("categories").insert(data);
    if (r.error) setNotice(r.error.message);
    else {
      setNotice("Category saved.");
      setCat(blankCat);
      load();
    }
  }
  async function saveProd() {
    setNotice("Saving product...");
    const { data: authData, error: authError } = await supabase.auth.refreshSession();
    if (authError || !["admin", "manager", "catalog"].includes(staffRole)) {
      setNotice("Your session is invalid or your role cannot manage products.");
      return;
    }
    const data = {
      ...prod,
      slug:
        prod.slug ||
        prod.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      category_id: prod.category_id || null,
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
    if (!confirm("Delete this permanently?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    setNotice(error?.message || "Deleted.");
    load();
  }
  async function saveSettings() {
    const { error } = await supabase
      .from("site_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setNotice(error?.message || "Website content updated.");
  }
  async function updateOrder(id: string, order_status: string) {
    setNotice(`Updating order to ${order_status}...`);
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    if (!token) { setNotice("Admin session expired. Please log in again."); return; }
    const response = await fetch("https://hhtqnpxarrbagyvswqrj.supabase.co/functions/v1/order-status-email", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: id, order_status }) });
    const data = await response.json().catch(() => ({}));
    setNotice(data?.error || (data?.email_sent ? `Order marked ${order_status}. Customer email sent.` : `Order marked ${order_status}.`));
    if (response.ok && !data?.error) load();
  }
  const activity = [
    ...orders.slice(0, 12).map((o) => ({ id: `order-${o.id}`, time: new Date(o.created_at).getTime(), title: `New order ${o.order_number}`, detail: `${o.customer_name} · ₹${Number(o.total_inr).toLocaleString("en-IN")} · ${o.payment_status || o.order_status}`, kind: "order" })),
    ...reviews.slice(0, 12).map((r) => ({ id: `review-${r.id}`, time: new Date(r.created_at).getTime(), title: "New customer review", detail: `${r.reviewer_name} · ${r.rating}/5 · ${r.title || "Review received"}`, kind: "review" })),
  ].sort((a, b) => b.time - a.time).slice(0, 15);
  const newActivityCount = activity.filter((a) => a.time > lastSeenActivity).length;
  const pendingOrders = orders.filter((o) => o.order_status === "pending").length;
  const pendingReviews = reviews.filter((r) => !r.is_approved).length;
  const lowStock = products.filter((p) => p.is_active && Number(p.stock_quantity) <= 3).length;
  const paidRevenue = orders.filter((o) => ["paid", "success", "completed"].includes(String(o.payment_status || "").toLowerCase())).reduce((sum, o) => sum + Number(o.total_inr || 0), 0);
  function openDashboard() {
    const now = Date.now();
    setLastSeenActivity(now);
    if (typeof window !== "undefined") localStorage.setItem("sg-admin-last-seen", String(now));
    setTab("dashboard");
  }

  if (!session)
    return (
      <main className="admin-login">
        <form onSubmit={login} autoComplete="off">
          <a className="admin-back" href="/">← Return to store</a>
          <div className="admin-login-brand">
            <img src="/shree-gauri-logo.png" alt="Shree Gauri" />
            <span>SHREE GAURI</span>
            <small>ADMINISTRATION</small>
          </div>
          <div className="admin-login-divider"><span>✦</span></div>
          <h1>{loginMode === "admin" ? "Main Admin Login" : "Staff Login"}</h1>
          <p>{loginMode === "admin" ? "Secure access for the main administrator." : "Use your invited work email and password to access your assigned tasks."}</p>
          <div role="group" aria-label="Choose sign-in type" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "0 0 18px" }}>
            <button type="button" aria-pressed={loginMode === "admin"} onClick={() => { setLoginMode("admin"); setError(""); }} style={{ width: "auto", padding: "11px 8px", borderRadius: 8, border: "1px solid #b69b67", background: loginMode === "admin" ? "#3d2a20" : "#fff", color: loginMode === "admin" ? "#fff" : "#3d2a20", cursor: "pointer" }}>Main Admin</button>
            <button type="button" aria-pressed={loginMode === "staff"} onClick={() => { setLoginMode("staff"); setError(""); }} style={{ width: "auto", padding: "11px 8px", borderRadius: 8, border: "1px solid #b69b67", background: loginMode === "staff" ? "#3d2a20" : "#fff", color: loginMode === "staff" ? "#fff" : "#3d2a20", cursor: "pointer" }}>Staff Login</button>
          </div>
          <label>
            Work email
            <input
              type="email"
              name="sg-admin-email"
              autoComplete="off"
              placeholder={loginMode === "admin" ? "Enter main admin email" : "Enter your invited work email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="sg-admin-password"
              autoComplete="new-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <b>{error}</b>}
          <button>{loginMode === "admin" ? "SECURE ADMIN LOGIN" : "SECURE STAFF LOGIN"}</button>
          <small className="admin-secure-note">{loginMode === "admin" ? "Main administrator access • Shree Gauri" : "Role-based staff access • Shree Gauri"}</small>
        </form>
      </main>
    );
  if (session && staffRole === "loading") return <main className="admin"><section className="admin-loading"><h1>Verifying staff access…</h1></section></main>;
  if (session && staffRole === "unauthorized") return <main className="admin"><section className="admin-loading"><h1>Access denied</h1><p>{notice || "This account is not authorized for Shree Gauri administration."}</p><button onClick={() => supabase.auth.signOut()}>Sign out</button></section></main>;
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
          Categories & Subcategories
        </button>
        )}
        {["admin", "manager", "catalog"].includes(staffRole) && (<>
          <button className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}><Package /> Products</button>
          <button className={tab === "inventory" ? "on" : ""} onClick={() => setTab("inventory")}><ClipboardList /> Inventory {lowStock > 0 && <b className="order-count">{lowStock}</b>}</button>
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
        {isPrimaryAdmin && <button className={tab === "staff" ? "on" : ""} onClick={() => setTab("staff")}><ShieldCheck /> Staff & Permissions</button>}
        <a href="/">View Store</a>
        <button onClick={() => supabase.auth.signOut()}>
          <LogOut />
          Log Out
        </button>
      </aside>
      <section>
        <header>
          <div>
            <small>ADMIN DASHBOARD</small>
            <h1>
              {tab === "dashboard"
                ? "Store Overview"
                : tab === "orders"
                ? "Customer Orders"
                : tab === "staff"
                  ? "Staff & Permissions"
                : tab === "customers"
                  ? "Customer Accounts"
                : tab === "categories"
                  ? "Categories & Subcategories"
                  : tab === "products"
                    ? "Products & Inventory"
                    : tab === "reviews"
                      ? "Customer Review Approval"
                      : "Photos, Logo & Homepage"}
            </h1>
          </div>
          {notice && <p>{notice}</p>}
        </header>
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
                  <button key={a.id} className="activity-row" onClick={() => setTab(a.kind === "order" ? "orders" : "reviews")}>
                    <span className={a.kind}>{a.kind === "order" ? "O" : "★"}</span>
                    <div><b>{a.title}</b><small>{a.detail}</small><em>{new Date(a.time).toLocaleString("en-IN")}</em></div>
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
            <div className="customer-admin-list">
              {customers.length ? customers.map((c) => {
                const customerOrders = orders.filter((o) =>
                  (c.id && (o as any).customer_id === c.id) ||
                  (!!c.email && !!o.email && o.email.toLowerCase() === c.email.toLowerCase())
                );
                const spent = customerOrders
                  .filter((o) => o.payment_status === "paid")
                  .reduce((sum, o) => sum + Number(o.total_inr || 0), 0);
                return (
                  <article key={c.id} className="customer-admin-card">
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
                  </article>
                );
              }) : <div className="admin-empty"><Users/><p>No customers yet.</p></div>}
            </div>
          </div>
        )}
        {tab === "orders" && (
          <div className="orders-admin">
            {orders.length ? (
              orders.map((o) => (
                <article key={o.id} className={`order-card ${o.order_status}`}>
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
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {isPrimaryAdmin && <button className="delete order-delete-button" onClick={() => deleteAdminRecord("order", o.id)}><Trash2 /> DELETE ORDER</button>}
                  </div>
                </article>
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
        {tab === "categories" && (
          <div className="admin-grid">
            <div className="editor">
              <h2>
                {cat.id ? "Edit Item" : "Add Category, Purpose or Planet"}
              </h2>
              <label>
                Homepage Section
                <select
                  value={cat.collection_type || "category"}
                  onChange={(e) =>
                    setCat({
                      ...cat,
                      collection_type: e.target.value,
                      parent_id: "",
                    })
                  }
                >
                  <option value="category">Shop by Category</option>
                  <option value="purpose">Shop by Purpose</option>
                  <option value="planet">Shop by Planet</option>
                </select>
              </label>
              <label>
                Name
                <input
                  value={cat.name}
                  onChange={(e) => setCat({ ...cat, name: e.target.value })}
                />
              </label>
              <label>
                URL Slug
                <input
                  value={cat.slug}
                  placeholder="created automatically"
                  onChange={(e) => setCat({ ...cat, slug: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  value={cat.description}
                  onChange={(e) =>
                    setCat({ ...cat, description: e.target.value })
                  }
                />
              </label>
              {cat.collection_type === "category" && (
                <label>
                  Parent Category
                  <select
                    value={cat.parent_id || ""}
                    onChange={(e) =>
                      setCat({ ...cat, parent_id: e.target.value })
                    }
                  >
                    <option value="">None — Main Category</option>
                    {cats
                      .filter(
                        (c) =>
                          c.id !== cat.id &&
                          !c.parent_id &&
                          c.collection_type === "category",
                      )
                      .map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label>
                Display Order
                <input
                  type="number"
                  value={cat.sort_order}
                  onChange={(e) =>
                    setCat({ ...cat, sort_order: e.target.value })
                  }
                />
              </label>
              <label>
                Icon / Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && upload(e.target.files[0], "cat")
                  }
                />
              </label>
              {cat.image_url && (
                <img className="admin-preview" src={cat.image_url} />
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={cat.is_active}
                  onChange={(e) =>
                    setCat({ ...cat, is_active: e.target.checked })
                  }
                />{" "}
                Visible on website
              </label>
              <div className="editor-actions">
                <button onClick={saveCat}>
                  <Save />
                  Save Item
                </button>
                <button onClick={() => setCat(blankCat)}>Clear</button>
              </div>
            </div>
            <div className="records">
              {cats.map((c) => (
                <article key={c.id}>
                  <div className="record-icon">
                    {c.image_url ? <img src={c.image_url} /> : <span>✦</span>}
                  </div>
                  <div>
                    <b>{c.name}</b>
                    <span>
                      {c.collection_type === "purpose"
                        ? "Shop by Purpose"
                        : c.collection_type === "planet"
                          ? "Shop by Planet"
                          : c.parent_id
                            ? "Subcategory"
                            : "Main category"}{" "}
                      · {c.is_active ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <button onClick={() => setCat(c)}>Edit</button>
                  <button
                    className="delete"
                    onClick={() => remove("categories", c.id)}
                  >
                    <Trash2 />
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
        {(tab === "products" || tab === "add-product") && (
          <div className="admin-product-workspace">
            {tab === "add-product" && <div className="editor product-editor" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "start", gap: 14, maxWidth: 1100, padding: 22 }}>
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
              <label>
                Category
                <select
                  value={prod.category_id || ""}
                  onChange={(e) =>
                    setProd({ ...prod, category_id: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
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
            {tab === "products" && <div className="records product-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))", alignItems: "stretch", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 4 }}>
                <input aria-label="Search products" placeholder="Search products by name…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} style={{ flex: "1 1 220px", minWidth: 180 }} />
                <select aria-label="Filter products" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} style={{ flex: "0 1 170px" }}><option value="all">All products</option><option value="active">Visible</option><option value="hidden">Hidden</option><option value="low-stock">Low stock (3 or less)</option></select>
                <small style={{ color: "#806f68" }}>{products.filter((p) => p.name.toLowerCase().includes(productQuery.trim().toLowerCase()) && (productFilter === "all" || (productFilter === "active" && p.is_active) || (productFilter === "hidden" && !p.is_active) || (productFilter === "low-stock" && Number(p.stock_quantity) <= 3))).length} of {products.length} products</small>
              </div>
              {products.filter((p) => p.name.toLowerCase().includes(productQuery.trim().toLowerCase()) && (productFilter === "all" || (productFilter === "active" && p.is_active) || (productFilter === "hidden" && !p.is_active) || (productFilter === "low-stock" && Number(p.stock_quantity) <= 3))).length ? (
                products.filter((p) => p.name.toLowerCase().includes(productQuery.trim().toLowerCase()) && (productFilter === "all" || (productFilter === "active" && p.is_active) || (productFilter === "hidden" && !p.is_active) || (productFilter === "low-stock" && Number(p.stock_quantity) <= 3))).map((p) => (
                  <article key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 9, minWidth: 0, borderRadius: 10, padding: 12, boxShadow: "0 2px 10px #3b160b0a" }}>
                    <img src={p.primary_image_url || "/placeholder.png"} alt="" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 7 }} />
                    <div>
                      <b>{p.name}</b>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 }}>
                        {quickEdit?.id === p.id && quickEdit.field === "price_inr" ? <input autoFocus aria-label={"Edit price for " + p.name} type="number" min="0" step="1" value={quickEdit.value} onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })} onBlur={() => saveQuickProductField(p.id, "price_inr", quickEdit.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.preventDefault(); e.currentTarget.onblur = null; setQuickEdit(null); } }} style={{ width: 112, padding: "6px 8px" }} /> : <button type="button" title="Click to edit price" onClick={() => setQuickEdit({ id: p.id, field: "price_inr", value: String(p.price_inr) })} style={{ border: "1px solid #d8c5ae", borderRadius: 7, padding: "6px 9px", background: "#fffaf3", color: "#4b3529", fontWeight: 700, cursor: "pointer" }}>₹{Number(p.price_inr).toLocaleString("en-IN")} <small>✎</small></button>}
                        <span>· Stock</span>
                        {quickEdit?.id === p.id && quickEdit.field === "stock_quantity" ? <input autoFocus aria-label={"Edit stock for " + p.name} type="number" min="0" step="1" value={quickEdit.value} onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })} onBlur={() => saveQuickProductField(p.id, "stock_quantity", quickEdit.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.preventDefault(); e.currentTarget.onblur = null; setQuickEdit(null); } }} style={{ width: 76, padding: "6px 8px" }} /> : <button type="button" title="Click to edit stock" onClick={() => setQuickEdit({ id: p.id, field: "stock_quantity", value: String(p.stock_quantity) })} style={{ border: "1px solid #d8c5ae", borderRadius: 7, padding: "6px 9px", background: "#fff", color: "#4b3529", cursor: "pointer" }}>{p.stock_quantity} <small>✎</small></button>}
                        <small style={{ color: "#806f68" }}>· {p.image_urls?.length || 0} extra photos · {p.is_active ? "Visible" : "Hidden"}</small>
                      </div>
                    </div>
                    <button onClick={() => { setProd(p); setTab("add-product"); }}>Edit</button>
                    <button
                      className={p.is_active ? "product-hide-button" : "product-show-button"}
                      onClick={() => toggleProductVisibility(p)}
                    >
                      {p.is_active ? "HIDE" : "SHOW"}
                    </button>
                    <button
                      className="delete"
                      onClick={() => remove("products", p.id)}
                    >
                      <Trash2 />
                    </button>
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
            </div>}
          </div>
        )}
        {tab === "inventory" && (
          <div className="inventory-admin">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div><h2 style={{ margin: 0, font: "28px Georgia,serif", color: "#421015" }}>Inventory Overview</h2><small style={{ color: "#806f68" }}>Update stock directly here. Changes save to your product inventory.</small></div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ background: "#fff", border: "1px solid #e2d7cc", padding: "9px 12px", borderRadius: 8 }}>{products.length} total products</span>
                <span style={{ background: "#fff4e5", border: "1px solid #efd4a9", padding: "9px 12px", borderRadius: 8 }}>{lowStock} low stock (3 or less)</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <input aria-label="Search inventory" placeholder="Search inventory by product name…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} style={{ flex: "1 1 260px", minWidth: 180, padding: 12, border: "1px solid #d8cbc0", background: "#fff" }} />
              <select aria-label="Filter inventory" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} style={{ padding: 12, border: "1px solid #d8cbc0", background: "#fff" }}><option value="all">All products</option><option value="active">Visible</option><option value="hidden">Hidden</option><option value="low-stock">Low stock (3 or less)</option></select>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2d7cc", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                <thead><tr style={{ background: "#f8f2eb", textAlign: "left" }}><th style={{ padding: 13 }}>Product</th><th style={{ padding: 13 }}>Price</th><th style={{ padding: 13 }}>Available stock</th><th style={{ padding: 13 }}>Status</th><th style={{ padding: 13 }}>Action</th></tr></thead>
                <tbody>
                  {products.filter((p) => p.name.toLowerCase().includes(productQuery.trim().toLowerCase()) && (productFilter === "all" || (productFilter === "active" && p.is_active) || (productFilter === "hidden" && !p.is_active) || (productFilter === "low-stock" && Number(p.stock_quantity) <= 3))).map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #eee5dc" }}>
                      <td style={{ padding: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}><img src={p.primary_image_url || "/placeholder.png"} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6, background: "#f3eee8" }} /><b>{p.name}</b></div></td>
                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>₹{Number(p.price_inr).toLocaleString("en-IN")}</td>
                      <td style={{ padding: 10 }}>{quickEdit?.id === p.id && quickEdit.field === "stock_quantity" ? <input autoFocus aria-label={"Edit stock for " + p.name} type="number" min="0" step="1" value={quickEdit.value} onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })} onBlur={() => saveQuickProductField(p.id, "stock_quantity", quickEdit.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.preventDefault(); e.currentTarget.onblur = null; setQuickEdit(null); } }} style={{ width: 90, padding: 8, border: "1px solid #d8c5ae" }} /> : <button type="button" onClick={() => setQuickEdit({ id: p.id, field: "stock_quantity", value: String(p.stock_quantity) })} style={{ border: "1px solid #d8c5ae", borderRadius: 7, padding: "8px 12px", background: Number(p.stock_quantity) <= 3 ? "#fff4e5" : "#fff", color: "#4b3529", fontWeight: 700 }}>{p.stock_quantity} ✎</button>}</td>
                      <td style={{ padding: 10 }}><span style={{ color: !p.is_active ? "#806f68" : Number(p.stock_quantity) <= 3 ? "#a45b00" : "#267347", fontWeight: 700 }}>{!p.is_active ? "Hidden" : Number(p.stock_quantity) <= 3 ? "Low stock" : "In stock"}</span></td>
                      <td style={{ padding: 10 }}><button onClick={() => { setProd(p); setTab("add-product"); }} style={{ border: "1px solid #d8c5ae", padding: "8px 11px", background: "#fff" }}>Edit product</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!products.length && <p style={{ padding: 24 }}>No products found.</p>}
            </div>
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
      </section>
    </main>
  );
}
