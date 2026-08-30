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
  is_active: true,
  is_featured: false,
};
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
    const [a, b, c, d, o] = await Promise.all([
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
