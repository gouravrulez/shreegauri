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
  category_ids: string[];
  sku: string | null;
  product_type: string | null;
  material: string | null;
  gemstone_name: string | null;
  natural_lab_status: string | null;
  origin: string | null;
  treatment: string | null;
  certification: string | null;
  shape: string | null;
  color: string | null;
  weight_grams: number | null;
  carat_weight: number | null;
  chakras: string[];
  zodiac_signs: string[];
  seo_title: string | null;
  seo_description: string | null;
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
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  refund_status: string;
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
  category_ids: [] as string[],
  sku: "",
  product_type: "",
  material: "",
  gemstone_name: "",
  natural_lab_status: "",
  origin: "",
  treatment: "",
  certification: "",
  shape: "",
  color: "",
  weight_grams: "",
  carat_weight: "",
  chakras: [] as string[],
  zodiac_signs: [] as string[],
  seo_title: "",
  seo_description: "",
  primary_image_url: "",
  image_urls: [] as string[],
  badge: "",
  is_active: true,
  is_featured: false,
};
const chakraOptions = ["Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown"];
const zodiacOptions = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null),
    [email, setEmail] = useState("gauritechnologiespvt@gmail.com"),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [tab, setTab] = useState("orders"),
    [cats, setCats] = useState<Cat[]>([]),
    [products, setProducts] = useState<Prod[]>([]),
    [reviews, setReviews] = useState<Review[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [settings, setSettings] = useState<any>(null),
    [cat, setCat] = useState<any>(blankCat),
    [prod, setProd] = useState<any>(blankProd),
    [notice, setNotice] = useState("");
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
          category_ids:
            Array.isArray(p.category_ids) && p.category_ids.length
              ? p.category_ids
              : p.category_id
                ? [p.category_id]
                : [],
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
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
    setNotice("Uploading promotional images...");
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
    setProd({ ...prod, image_urls: [...(prod.image_urls || []), ...urls] });
    setNotice(`${urls.length} promotional image(s) ready. Save the product.`);
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
    const data = {
      ...prod,
      slug:
        prod.slug ||
        prod.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      category_ids: Array.isArray(prod.category_ids) ? prod.category_ids : [],
      category_id:
        (Array.isArray(prod.category_ids) && prod.category_ids[0]) ||
        prod.category_id ||
        null,
      sku: prod.sku?.trim() || null,
      weight_grams: prod.weight_grams ? Number(prod.weight_grams) : null,
      carat_weight: prod.carat_weight ? Number(prod.carat_weight) : null,
      chakras: Array.isArray(prod.chakras) ? prod.chakras : [],
      zodiac_signs: Array.isArray(prod.zodiac_signs) ? prod.zodiac_signs : [],
      seo_title: prod.seo_title?.trim() || null,
      seo_description: prod.seo_description?.trim() || null,
      price_inr: Number(prod.price_inr),
      compare_at_price_inr: prod.compare_at_price_inr
        ? Number(prod.compare_at_price_inr)
        : null,
      stock_quantity: Number(prod.stock_quantity),
    };
    const r = prod.id
      ? await supabase.from("products").update(data).eq("id", prod.id)
      : await supabase.from("products").insert(data);
    if (r.error) setNotice(r.error.message);
    else {
      setNotice("Product saved.");
      setProd(blankProd);
      load();
    }
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
  async function updateFulfilment(id: string, changes: Record<string, any>) {
    const { error } = await supabase.from("orders").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", id);
    setNotice(error?.message || "Order fulfilment updated.");
    load();
  }
  async function updateOrder(id: string, order_status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setNotice(error?.message || `Order marked ${order_status}.`);
    load();
  }
  if (!session)
    return (
      <main className="admin-login">
        <form onSubmit={login}>
          <a href="/">← Return to store</a>
          <h1>Shree Gauri Admin</h1>
          <p>Sign in securely to manage the complete store.</p>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <b>{error}</b>}
          <button>LOGIN</button>
        </form>
      </main>
    );
  return (
    <main className="admin">
      <aside>
        <h2>
          <Store /> Shree Gauri
        </h2>
        <span>Store Control Centre</span>
        <button
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
        <button
          className={tab === "customers" ? "on" : ""}
          onClick={() => setTab("customers")}
        >
          <Users />
          Customers
          {customers.filter((c) => c.auth_user_id).length > 0 && (
            <b className="order-count">{customers.filter((c) => c.auth_user_id).length}</b>
          )}
        </button>
        <button
          className={tab === "categories" ? "on" : ""}
          onClick={() => setTab("categories")}
        >
          <Layers />
          Categories & Subcategories
        </button>
        <button
          className={tab === "products" ? "on" : ""}
          onClick={() => setTab("products")}
        >
          <Package />
          Products & Inventory
        </button>
        <button
          className={tab === "reviews" ? "on" : ""}
          onClick={() => setTab("reviews")}
        >
          <Star />
          Customer Reviews
        </button>
        <button
          className={tab === "settings" ? "on" : ""}
          onClick={() => setTab("settings")}
        >
          <Settings />
          Photos, Logo & Homepage
        </button>
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
              {tab === "orders"
                ? "Customer Orders"
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
                        <span>
                          {[c.address_line1,c.address_line2,c.city,c.state,c.pincode].filter(Boolean).join(", ") || "Not provided"}
                        </span>
                      </div>
                    </div>
                    {customerOrders.length > 0 && (
                      <div className="customer-admin-orders">
                        <small>RECENT ORDERS</small>
                        {customerOrders.slice(0,3).map((o) => (
                          <span key={o.id}>
                            <b>{o.order_number}</b>
                            {o.order_status} • ₹{Number(o.total_inr).toLocaleString("en-IN")}
                          </span>
                        ))}
                      </div>
                    )}
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
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"8px",margin:"12px 0"}}>
                    <input placeholder="Courier name" defaultValue={o.courier_name || ""} onBlur={(e)=>updateFulfilment(o.id,{courier_name:e.target.value || null})} />
                    <input placeholder="Tracking / AWB number" defaultValue={o.tracking_number || ""} onBlur={(e)=>updateFulfilment(o.id,{tracking_number:e.target.value || null})} />
                    <input placeholder="Tracking URL" defaultValue={o.tracking_url || ""} onBlur={(e)=>updateFulfilment(o.id,{tracking_url:e.target.value || null})} />
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
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
        {tab === "products" && (
          <div className="admin-grid">
            <div className="editor">
              <h2>{prod.id ? "Edit Product" : "Add Product"}</h2>
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
              <div
                style={{
                  border: "1px solid #d8cbc0",
                  padding: "14px",
                  background: "#fff",
                }}
              >
                <b style={{ display: "block", marginBottom: "10px" }}>
                  Categories — select one or more
                </b>
                <small style={{ display: "block", marginBottom: "12px", color: "#806f68" }}>
                  The same product can appear in several categories, purposes or planets.
                </small>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "9px 12px",
                  }}
                >
                  {cats.map((c) => {
                    const selected = (prod.category_ids || []).includes(c.id);
                    const group =
                      c.collection_type === "purpose"
                        ? "Purpose"
                        : c.collection_type === "planet"
                          ? "Planet"
                          : c.parent_id
                            ? "Subcategory"
                            : "Category";
                    return (
                      <label
                        key={c.id}
                        className="check"
                        style={{
                          border: "1px solid #eadfd5",
                          padding: "9px",
                          borderRadius: "4px",
                          background: selected ? "#fff6df" : "#fff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = Array.isArray(prod.category_ids)
                              ? prod.category_ids
                              : [];
                            const category_ids = e.target.checked
                              ? Array.from(new Set([...current, c.id]))
                              : current.filter((id: string) => id !== c.id);
                            setProd({
                              ...prod,
                              category_ids,
                              category_id: category_ids[0] || "",
                            });
                          }}
                        />{" "}
                        <span>
                          {c.name}
                          <small
                            style={{
                              display: "block",
                              fontWeight: 400,
                              color: "#8a766e",
                              marginTop: "2px",
                            }}
                          >
                            {group}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "12px" }}>Product Details & Inventory</h3>
                <div className="two">
                  <label>
                    SKU
                    <input value={prod.sku || ""} placeholder="Auto-generated if left blank"
                      onChange={(e) => setProd({ ...prod, sku: e.target.value })} />
                  </label>
                  <label>
                    Product Type
                    <input value={prod.product_type || ""} placeholder="Gemstone, Ring, Bracelet..."
                      onChange={(e) => setProd({ ...prod, product_type: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Material
                    <input value={prod.material || ""} placeholder="Silver, Gold, Brass..."
                      onChange={(e) => setProd({ ...prod, material: e.target.value })} />
                  </label>
                  <label>
                    Gemstone
                    <input value={prod.gemstone_name || ""} placeholder="Emerald, Citrine..."
                      onChange={(e) => setProd({ ...prod, gemstone_name: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Stone Weight (Carat)
                    <input type="number" step="0.001" value={prod.carat_weight || ""}
                      onChange={(e) => setProd({ ...prod, carat_weight: e.target.value })} />
                  </label>
                  <label>
                    Weight (grams)
                    <input type="number" step="0.001" value={prod.weight_grams || ""}
                      onChange={(e) => setProd({ ...prod, weight_grams: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Shape
                    <input value={prod.shape || ""}
                      onChange={(e) => setProd({ ...prod, shape: e.target.value })} />
                  </label>
                  <label>
                    Colour
                    <input value={prod.color || ""}
                      onChange={(e) => setProd({ ...prod, color: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Natural / Lab Status
                    <select value={prod.natural_lab_status || ""}
                      onChange={(e) => setProd({ ...prod, natural_lab_status: e.target.value })}>
                      <option value="">Not specified</option>
                      <option value="Natural">Natural</option>
                      <option value="Lab Created">Lab Created</option>
                    </select>
                  </label>
                  <label>
                    Certification
                    <select value={prod.certification || ""}
                      onChange={(e) => setProd({ ...prod, certification: e.target.value })}>
                      <option value="">Not specified</option>
                      <option value="Certificate Available">Yes — Certificate Available</option>
                      <option value="No Certificate">No Certificate</option>
                    </select>
                  </label>
                </div>
                <div className="two">
                  <label>
                    Origin
                    <input value={prod.origin || ""} placeholder="Only enter if verified"
                      onChange={(e) => setProd({ ...prod, origin: e.target.value })} />
                  </label>
                  <label>
                    Treatment
                    <input value={prod.treatment || ""} placeholder="Only enter if known"
                      onChange={(e) => setProd({ ...prod, treatment: e.target.value })} />
                  </label>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "6px" }}>Chakra</h3>
                <small style={{ display: "block", marginBottom: "10px", color: "#806f68" }}>
                  Select only associations you want to use for this product.
                </small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
                  {chakraOptions.map((name) => (
                    <label className="check" key={name}>
                      <input type="checkbox" checked={(prod.chakras || []).includes(name)}
                        onChange={(e) => {
                          const current = prod.chakras || [];
                          setProd({ ...prod, chakras: e.target.checked
                            ? Array.from(new Set([...current, name]))
                            : current.filter((x: string) => x !== name) });
                        }} />{" "}{name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "6px" }}>Zodiac</h3>
                <small style={{ display: "block", marginBottom: "10px", color: "#806f68" }}>
                  You may select more than one zodiac sign.
                </small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
                  {zodiacOptions.map((name) => (
                    <label className="check" key={name}>
                      <input type="checkbox" checked={(prod.zodiac_signs || []).includes(name)}
                        onChange={(e) => {
                          const current = prod.zodiac_signs || [];
                          setProd({ ...prod, zodiac_signs: e.target.checked
                            ? Array.from(new Set([...current, name]))
                            : current.filter((x: string) => x !== name) });
                        }} />{" "}{name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "12px" }}>Google / SEO</h3>
                <label>
                  SEO Title
                  <input value={prod.seo_title || ""} maxLength={70}
                    placeholder={prod.name ? prod.name + " | Shree Gauri" : "Product title for Google"}
                    onChange={(e) => setProd({ ...prod, seo_title: e.target.value })} />
                </label>
                <label>
                  SEO Description
                  <textarea value={prod.seo_description || ""} maxLength={170}
                    placeholder="Short accurate description for search engines"
                    onChange={(e) => setProd({ ...prod, seo_description: e.target.value })} />
                </label>
              </div>

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
                Additional Promotional Images (select many)
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
                <div className="admin-gallery">
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
              <div className="editor-actions">
                <button onClick={saveProd}>
                  <Save />
                  Save Product
                </button>
                <button onClick={() => setProd(blankProd)}>Clear</button>
              </div>
            </div>
            <div className="records">
              {products.length ? (
                products.map((p) => (
                  <article key={p.id}>
                    <img src={p.primary_image_url} />
                    <div>
                      <b>{p.name}</b>
                      <span>
                        ₹{p.price_inr} · Stock {p.stock_quantity} ·{" "}
                        {p.image_urls?.length || 0} extra photos ·{" "}
                        {p.is_active ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <button onClick={() => setProd(p)}>Edit</button>
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
        {tab === "settings" && settings && (
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
