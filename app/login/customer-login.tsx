"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  UserRound,
  Package,
  MapPin,
  LogOut,
  ShoppingBag,
  Truck,
  CalendarDays,
  Phone,
  Mail,
  Home,
} from "lucide-react";

type Profile = {
  id?: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
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
  subtotal_inr: number;
  shipping_inr: number;
  discount_inr: number;
  total_inr: number;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  courier_name: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const blankProfile: Profile = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CustomerLogin() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>(blankProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [section, setSection] = useState<"overview" | "orders" | "profile">("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadAccount();
    else {
      setProfile(blankProfile);
      setOrders([]);
    }
  }, [user]);

  async function loadAccount() {
    setLoading(true);
    const [p, o] = await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("*,order_items(*)")
        .order("created_at", { ascending: false }),
    ]);

    if (p.data) {
      setProfile({
        ...blankProfile,
        ...p.data,
        date_of_birth: p.data.date_of_birth || "",
      });
    } else {
      setProfile({
        ...blankProfile,
        auth_user_id: user.id,
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        date_of_birth: user.user_metadata?.date_of_birth || "",
      });
    }

    if (o.data) setOrders(o.data as Order[]);
    setLoading(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error?.message || "Welcome back.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: signupName,
          phone: signupPhone,
          date_of_birth: signupDob,
        },
      },
    });
    setMessage(
      error?.message ||
        "Account created. Please check your email if verification is required.",
    );
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");

    const payload = {
      auth_user_id: user.id,
      full_name: profile.full_name || null,
      email: user.email || profile.email || null,
      phone: profile.phone || null,
      date_of_birth: profile.date_of_birth || null,
      address_line1: profile.address_line1 || null,
      address_line2: profile.address_line2 || null,
      city: profile.city || null,
      state: profile.state || null,
      pincode: profile.pincode || null,
      updated_at: new Date().toISOString(),
    };

    const result = profile.id
      ? await supabase.from("customers").update(payload).eq("id", profile.id)
      : await supabase.from("customers").insert(payload);

    setSaving(false);
    setMessage(result.error?.message || "Profile updated successfully.");
    if (!result.error) loadAccount();
  }

  const paidOrders = useMemo(
    () => orders.filter((o) => o.payment_status === "paid"),
    [orders],
  );

  const statusLabel = (status: string) =>
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading && !user) {
    return (
      <main className="customer-auth">
        <section className="account-card">
          <p>Loading your Shree Gauri account...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="customer-auth">
        <section className="login-panel">
          <div className="login-art">
            <span>श्रीं</span>
            <h2>
              Welcome to
              <br />
              Shree Gauri
            </h2>
            <p>
              Track orders, manage your profile and keep your Shree Gauri account
              details in one secure place.
            </p>
          </div>
          <form onSubmit={submit}>
            <a href="/">← Return to store</a>
            <small>YOUR SHREE GAURI ACCOUNT</small>
            <h1>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h1>

            {mode === "signup" && (
              <>
                <label>
                  Full Name
                  <input
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Mobile Number
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Date of Birth
                  <input
                    type="date"
                    value={signupDob}
                    onChange={(e) => setSignupDob(e.target.value)}
                  />
                </label>
              </>
            )}

            <label>
              Email Address
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {message && <p className="auth-message">{message}</p>}
            <button>{mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}</button>
            <p>
              {mode === "login"
                ? "New to Shree Gauri?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Create account" : "Login"}
              </button>
            </p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="customer-dashboard">
      <header className="customer-dash-head">
        <a href="/" className="customer-brand">
          SHREE GAURI
          <small>My Account</small>
        </a>
        <div>
          <span>
            Hello, <b>{profile.full_name || user.email?.split("@")[0]}</b>
          </span>
          <a href="/" className="customer-return-store">
            <Home /> Return to Store
          </a>
          <button onClick={() => supabase.auth.signOut()}>
            <LogOut /> Log Out
          </button>
        </div>
      </header>

      <div className="customer-dash-layout">
        <aside className="customer-dash-nav">
          <div className="customer-avatar">
            <UserRound />
          </div>
          <b>{profile.full_name || "Shree Gauri Customer"}</b>
          <small>{user.email}</small>

          <button
            className={section === "overview" ? "active" : ""}
            onClick={() => setSection("overview")}
          >
            <Home /> Account Overview
          </button>
          <button
            className={section === "orders" ? "active" : ""}
            onClick={() => setSection("orders")}
          >
            <Package /> My Orders
          </button>
          <button
            className={section === "profile" ? "active" : ""}
            onClick={() => setSection("profile")}
          >
            <UserRound /> Profile & Address
          </button>
          <a href="/">
            <ShoppingBag /> Continue Shopping
          </a>
        </aside>

        <section className="customer-dash-content">
          {message && <p className="account-message">{message}</p>}

          {section === "overview" && (
            <>
              <div className="customer-welcome">
                <small>MY SHREE GAURI</small>
                <h1>Welcome, {profile.full_name?.split(" ")[0] || "Customer"}</h1>
                <p>
                  Manage your orders, delivery details and personal information
                  from your account.
                </p>
              </div>

              <div className="customer-summary-grid">
                <button onClick={() => setSection("orders")}>
                  <Package />
                  <span>
                    <strong>{orders.length}</strong>
                    Total Orders
                  </span>
                </button>
                <button onClick={() => setSection("orders")}>
                  <Truck />
                  <span>
                    <strong>
                      {
                        orders.filter((o) =>
                          ["packed", "shipped", "out_for_delivery"].includes(
                            o.order_status,
                          ),
                        ).length
                      }
                    </strong>
                    In Progress
                  </span>
                </button>
                <button onClick={() => setSection("profile")}>
                  <UserRound />
                  <span>
                    <strong>{profile.phone ? "Saved" : "Add"}</strong>
                    Profile
                  </span>
                </button>
              </div>

              <div className="customer-panel">
                <div className="customer-panel-title">
                  <div>
                    <small>RECENT ACTIVITY</small>
                    <h2>Your Recent Orders</h2>
                  </div>
                  <button onClick={() => setSection("orders")}>VIEW ALL</button>
                </div>
                {orders.slice(0, 3).length ? (
                  orders.slice(0, 3).map((o) => (
                    <div className="customer-order-row" key={o.id}>
                      <div>
                        <small>{new Date(o.created_at).toLocaleDateString("en-IN")}</small>
                        <b>{o.order_number}</b>
                      </div>
                      <span>{statusLabel(o.order_status)}</span>
                      <strong>
                        ₹{Number(o.total_inr).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  ))
                ) : (
                  <div className="customer-empty">
                    <ShoppingBag />
                    <h3>No orders yet</h3>
                    <p>Your Shree Gauri orders will appear here after checkout.</p>
                    <a href="/">START SHOPPING</a>
                  </div>
                )}
              </div>

              <div className="customer-panel account-detail-preview">
                <div>
                  <UserRound />
                  <span>
                    <small>PROFILE</small>
                    <b>{profile.full_name || "Add your name"}</b>
                    <p>{profile.phone || "Add your mobile number"}</p>
                  </span>
                </div>
                <div>
                  <MapPin />
                  <span>
                    <small>DEFAULT ADDRESS</small>
                    <b>{profile.city || "Add delivery address"}</b>
                    <p>
                      {[profile.address_line1, profile.state, profile.pincode]
                        .filter(Boolean)
                        .join(", ") || "Save your address for your account."}
                    </p>
                  </span>
                </div>
              </div>
            </>
          )}

          {section === "orders" && (
            <>
              <div className="customer-page-title">
                <small>ORDER HISTORY</small>
                <h1>My Orders</h1>
                <p>View payment, fulfilment and delivery details for your orders.</p>
              </div>

              <div className="customer-orders-list">
                {orders.length ? (
                  orders.map((o) => (
                    <article key={o.id} className="customer-order-card">
                      <div className="customer-order-top">
                        <div>
                          <small>ORDER PLACED</small>
                          <b>{new Date(o.created_at).toLocaleDateString("en-IN")}</b>
                        </div>
                        <div>
                          <small>TOTAL</small>
                          <b>₹{Number(o.total_inr).toLocaleString("en-IN")}</b>
                        </div>
                        <div>
                          <small>ORDER</small>
                          <b>{o.order_number}</b>
                        </div>
                      </div>

                      <div className="customer-order-status">
                        <div>
                          <span className={`status-dot ${o.order_status}`} />
                          <div>
                            <small>STATUS</small>
                            <h3>{statusLabel(o.order_status)}</h3>
                            <p>
                              Payment: {statusLabel(o.payment_status)}
                              {o.courier_name ? ` • ${o.courier_name}` : ""}
                            </p>
                          </div>
                        </div>
                        {o.tracking_url && (
                          <a href={o.tracking_url} target="_blank" rel="noreferrer">
                            TRACK PACKAGE
                          </a>
                        )}
                      </div>

                      <div className="customer-order-items">
                        {o.order_items?.map((i) => (
                          <div key={i.id}>
                            <span>
                              <b>{i.product_name}</b>
                              {i.variant_label && <small>{i.variant_label}</small>}
                              <small>Qty: {i.quantity}</small>
                            </span>
                            <strong>
                              ₹{Number(i.line_total_inr).toLocaleString("en-IN")}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {o.tracking_number && (
                        <div className="customer-tracking">
                          <Truck />
                          Tracking: <b>{o.tracking_number}</b>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="customer-empty">
                    <Package />
                    <h3>No orders found</h3>
                    <p>Orders placed using this account email will appear here.</p>
                    <a href="/">SHOP SHREE GAURI</a>
                  </div>
                )}
              </div>
            </>
          )}

          {section === "profile" && (
            <>
              <div className="customer-page-title">
                <small>PERSONAL INFORMATION</small>
                <h1>Profile & Address</h1>
                <p>Keep your account and delivery information up to date.</p>
              </div>

              <form className="customer-profile-form" onSubmit={saveProfile}>
                <div className="customer-form-section">
                  <h2>
                    <UserRound /> Personal Details
                  </h2>
                  <div className="customer-form-grid">
                    <label>
                      Full Name
                      <input
                        value={profile.full_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Email Address
                      <input value={user.email || ""} disabled />
                    </label>
                    <label>
                      Mobile Number
                      <input
                        type="tel"
                        value={profile.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Date of Birth
                      <input
                        type="date"
                        value={profile.date_of_birth || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            date_of_birth: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="customer-form-section">
                  <h2>
                    <MapPin /> Delivery Address
                  </h2>
                  <div className="customer-form-grid">
                    <label className="wide">
                      Address Line 1
                      <input
                        value={profile.address_line1 || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address_line1: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="wide">
                      Address Line 2
                      <input
                        value={profile.address_line2 || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address_line2: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      City
                      <input
                        value={profile.city || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, city: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      State
                      <input
                        value={profile.state || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, state: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      PIN Code
                      <input
                        value={profile.pincode || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, pincode: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>

                <button className="customer-save" disabled={saving}>
                  {saving ? "SAVING..." : "SAVE PROFILE"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
