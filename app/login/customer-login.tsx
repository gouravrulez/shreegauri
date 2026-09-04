"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  UserRound, Package, MapPin, LogOut, ShoppingBag, Truck, Home,
  Plus, Trash2, CheckCircle2
} from "lucide-react";

type Profile = {
  id?: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
};

type Address = {
  id: string;
  customer_id: string;
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

type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  line_total_inr: number;
};

type Order = {
  id: string;
  order_number: string;
  total_inr: number;
  payment_status: string;
  order_status: string;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const blankProfile: Profile = {
  full_name: "", email: "", phone: "", date_of_birth: ""
};

const blankAddress = {
  label: "Home",
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CustomerLogin() {
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>(blankProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState(blankAddress);
  const [section, setSection] = useState<"overview" | "orders" | "profile" | "addresses">("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      setAddresses([]);
    }
  }, [user]);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setMessage("Sending verification code...");
    const data = { full_name: fullName };
    if (channel === "email") {
      const email = identifier.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data },
      });
      if (error) return setMessage(error.message);
    } else {
      let phone = identifier.replace(/\s+/g, "");
      if (!phone.startsWith("+")) phone = `+91${phone.replace(/^0+/, "")}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true, data },
      });
      if (error) return setMessage(error.message);
      setIdentifier(phone);
    }
    setOtpSent(true);
    setMessage("Enter the 6-digit verification code.");
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setMessage("Verifying...");
    const result =
      channel === "email"
        ? await supabase.auth.verifyOtp({
            email: identifier.trim().toLowerCase(),
            token: otp.trim(),
            type: "email",
          })
        : await supabase.auth.verifyOtp({
            phone: identifier.trim(),
            token: otp.trim(),
            type: "sms",
          });

    if (result.error) return setMessage(result.error.message);
    setMessage("Welcome to Shree Gauri.");
    const params = new URLSearchParams(window.location.search);
    if (params.get("returnTo") === "checkout") {
      window.location.href = "/?checkout=1";
    }
  }

  async function loadAccount() {
    setLoading(true);
    let { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      const created = await supabase
        .from("customers")
        .insert({
          auth_user_id: user.id,
          full_name: user.user_metadata?.full_name || "",
          email: user.email || null,
          phone: user.phone || null,
        })
        .select("*")
        .single();
      customer = created.data;
    }

    if (customer) {
      setProfile({
        id: customer.id,
        auth_user_id: customer.auth_user_id,
        full_name: customer.full_name || user.user_metadata?.full_name || "",
        email: customer.email || user.email || "",
        phone: customer.phone || user.phone || "",
        date_of_birth: customer.date_of_birth || "",
      });

      const [a, o] = await Promise.all([
        supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", customer.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("orders")
          .select("*,order_items(*)")
          .order("created_at", { ascending: false }),
      ]);
      if (a.data) setAddresses(a.data as Address[]);
      if (o.data) setOrders(o.data as Order[]);
    }
    setLoading(false);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user || !profile.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({
        full_name: profile.full_name || null,
        email: profile.email || user.email || null,
        phone: profile.phone || user.phone || null,
        date_of_birth: profile.date_of_birth || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setSaving(false);
    setMessage(error?.message || "Profile updated.");
    if (!error) loadAccount();
  }

  async function addAddress(e: FormEvent) {
    e.preventDefault();
    if (!profile.id) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: profile.id,
        label: newAddress.label || "Home",
        recipient_name: newAddress.recipient_name || profile.full_name || null,
        phone: newAddress.phone || profile.phone || null,
        line1: newAddress.line1,
        line2: newAddress.line2 || null,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        is_default: false,
      })
      .select("id")
      .single();

    if (!error && data?.id && addresses.length === 0) {
      await supabase.rpc("set_default_customer_address", { p_address_id: data.id });
    }
    setSaving(false);
    setMessage(error?.message || "Address saved.");
    if (!error) {
      setNewAddress(blankAddress);
      loadAccount();
    }
  }

  async function makeDefault(id: string) {
    const { error } = await supabase.rpc("set_default_customer_address", {
      p_address_id: id,
    });
    setMessage(error?.message || "Default address updated.");
    if (!error) loadAccount();
  }

  async function removeAddress(id: string) {
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    setMessage(error?.message || "Address removed.");
    if (!error) loadAccount();
  }

  const statusLabel = (status: string) =>
    status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.is_default) || addresses[0],
    [addresses]
  );

  if (loading && !user) {
    return <main className="customer-auth"><section className="account-card"><p>Loading your Shree Gauri account...</p></section></main>;
  }

  if (!user) {
    return (
      <main className="customer-auth">
        <section className="login-panel">
          <div className="login-art">
            <span>श्रीं</span>
            <h2>Welcome to<br />Shree Gauri</h2>
            <p>Quick, secure OTP login. No email confirmation links and no password to remember.</p>
          </div>

          {!otpSent ? (
            <form onSubmit={sendOtp}>
              <a href="/">← Return to store</a>
              <small>YOUR SHREE GAURI ACCOUNT</small>
              <h1>Login or Sign Up</h1>

              <div className="otp-channel">
                <button type="button" className={channel === "email" ? "active" : ""} onClick={() => { setChannel("email"); setIdentifier(""); setMessage(""); }}>
                  EMAIL OTP
                </button>
                <button type="button" className={channel === "phone" ? "active" : ""} onClick={() => { setChannel("phone"); setIdentifier(""); setMessage(""); }}>
                  MOBILE OTP
                </button>
              </div>

              <label>
                Full Name <small>(first-time customers)</small>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </label>

              <label>
                {channel === "email" ? "Email Address" : "Mobile Number"}
                <input
                  type={channel === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={channel === "email" ? "you@example.com" : "9876543210"}
                  required
                />
              </label>

              {message && <p className="auth-message">{message}</p>}
              <button>SEND VERIFICATION CODE</button>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <a href="/">← Return to store</a>
              <small>SHREE GAURI VERIFICATION</small>
              <h1>Enter OTP</h1>
              <p>We sent a verification code to {identifier}.</p>
              <label>
                6-digit OTP
                <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
              </label>
              {message && <p className="auth-message">{message}</p>}
              <button>VERIFY & CONTINUE</button>
              <button type="button" className="text-button" onClick={() => { setOtpSent(false); setOtp(""); setMessage(""); }}>
                Change email/mobile
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="customer-dashboard">
      <header className="customer-dash-head">
        <a href="/" className="customer-brand">SHREE GAURI<small>My Account</small></a>
        <div>
          <span>Hello, <b>{profile.full_name || user.email?.split("@")[0] || "Customer"}</b></span>
          <a href="/" className="customer-return-store"><Home /> Return to Store</a>
          <button onClick={() => supabase.auth.signOut()}><LogOut /> Log Out</button>
        </div>
      </header>

      <div className="customer-dash-layout">
        <aside className="customer-dash-nav">
          <div className="customer-avatar"><UserRound /></div>
          <b>{profile.full_name || "Shree Gauri Customer"}</b>
          <small>{profile.email || profile.phone}</small>
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><Home /> Account Overview</button>
          <button className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}><Package /> My Orders</button>
          <button className={section === "profile" ? "active" : ""} onClick={() => setSection("profile")}><UserRound /> Profile</button>
          <button className={section === "addresses" ? "active" : ""} onClick={() => setSection("addresses")}><MapPin /> Saved Addresses</button>
          <a href="/"><ShoppingBag /> Continue Shopping</a>
        </aside>

        <section className="customer-dash-content">
          {message && <p className="account-message">{message}</p>}

          {section === "overview" && (
            <>
              <div className="customer-welcome">
                <small>MY SHREE GAURI</small>
                <h1>Welcome, {profile.full_name?.split(" ")[0] || "Customer"}</h1>
                <p>Manage orders, delivery addresses and account details from one place.</p>
              </div>
              <div className="customer-summary-grid">
                <button onClick={() => setSection("orders")}><Package /><span><strong>{orders.length}</strong>Total Orders</span></button>
                <button onClick={() => setSection("orders")}><Truck /><span><strong>{orders.filter((o) => ["confirmed","processing","packed","shipped","out_for_delivery"].includes(o.order_status)).length}</strong>In Progress</span></button>
                <button onClick={() => setSection("addresses")}><MapPin /><span><strong>{addresses.length}</strong>Saved Addresses</span></button>
              </div>
              <div className="customer-panel">
                <div className="customer-panel-title"><div><small>RECENT ACTIVITY</small><h2>Your Recent Orders</h2></div><button onClick={() => setSection("orders")}>VIEW ALL</button></div>
                {orders.length ? orders.slice(0,3).map((o) => (
                  <div className="customer-order-row" key={o.id}>
                    <div><small>{new Date(o.created_at).toLocaleDateString("en-IN")}</small><b>{o.order_number}</b></div>
                    <span>{statusLabel(o.order_status)}</span>
                    <strong>₹{Number(o.total_inr).toLocaleString("en-IN")}</strong>
                  </div>
                )) : <div className="customer-empty"><ShoppingBag /><h3>No orders yet</h3><p>Your paid Shree Gauri orders will appear here.</p><a href="/">START SHOPPING</a></div>}
              </div>
              <div className="customer-panel account-detail-preview">
                <div><UserRound /><span><small>PROFILE</small><b>{profile.full_name || "Add your name"}</b><p>{profile.phone || profile.email}</p></span></div>
                <div><MapPin /><span><small>DEFAULT ADDRESS</small><b>{defaultAddress?.label || "Add delivery address"}</b><p>{defaultAddress ? [defaultAddress.line1, defaultAddress.city, defaultAddress.state, defaultAddress.pincode].filter(Boolean).join(", ") : "Save an address for faster checkout."}</p></span></div>
              </div>
            </>
          )}

          {section === "orders" && (
            <>
              <div className="customer-page-title"><small>ORDER HISTORY</small><h1>My Orders</h1><p>Payment, fulfilment and delivery status for every order.</p></div>
              <div className="customer-orders-list">
                {orders.length ? orders.map((o) => (
                  <article key={o.id} className="customer-order-card">
                    <div className="customer-order-top">
                      <div><small>ORDER PLACED</small><b>{new Date(o.created_at).toLocaleDateString("en-IN")}</b></div>
                      <div><small>TOTAL</small><b>₹{Number(o.total_inr).toLocaleString("en-IN")}</b></div>
                      <div><small>ORDER</small><b>{o.order_number}</b></div>
                    </div>
                    <div className="customer-order-status">
                      <div><span className={`status-dot ${o.order_status}`} /><div><small>STATUS</small><h3>{statusLabel(o.order_status)}</h3><p>Payment: {statusLabel(o.payment_status)}{o.courier_name ? ` • ${o.courier_name}` : ""}</p></div></div>
                      {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noreferrer">TRACK PACKAGE</a>}
                    </div>
                    <div className="customer-order-items">
                      {o.order_items?.map((i) => (
                        <div key={i.id}><span><b>{i.product_name}</b>{i.variant_label && <small>{i.variant_label}</small>}<small>Qty: {i.quantity}</small></span><strong>₹{Number(i.line_total_inr).toLocaleString("en-IN")}</strong></div>
                      ))}
                    </div>
                    {o.tracking_number && <div className="customer-tracking"><Truck /> Tracking: <b>{o.tracking_number}</b></div>}
                  </article>
                )) : <div className="customer-empty"><Package /><h3>No orders found</h3><p>Orders paid with this account will appear here.</p><a href="/">SHOP SHREE GAURI</a></div>}
              </div>
            </>
          )}

          {section === "profile" && (
            <>
              <div className="customer-page-title"><small>PERSONAL INFORMATION</small><h1>Profile</h1><p>Keep your contact details up to date.</p></div>
              <form className="customer-profile-form" onSubmit={saveProfile}>
                <div className="customer-form-section">
                  <h2><UserRound /> Personal Details</h2>
                  <div className="customer-form-grid">
                    <label>Full Name<input value={profile.full_name} onChange={(e) => setProfile({...profile, full_name:e.target.value})} required /></label>
                    <label>Email Address<input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email:e.target.value})} /></label>
                    <label>Mobile Number<input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone:e.target.value})} /></label>
                    <label>Date of Birth<input type="date" value={profile.date_of_birth} onChange={(e) => setProfile({...profile, date_of_birth:e.target.value})} /></label>
                  </div>
                </div>
                <button className="customer-save" disabled={saving}>{saving ? "SAVING..." : "SAVE PROFILE"}</button>
              </form>
            </>
          )}

          {section === "addresses" && (
            <>
              <div className="customer-page-title"><small>DELIVERY</small><h1>Saved Addresses</h1><p>Add Home, Work or any other delivery address and select one during checkout.</p></div>
              <div className="sg-address-list">
                {addresses.map((a) => (
                  <article className={`sg-address-card ${a.is_default ? "default" : ""}`} key={a.id}>
                    <div><b>{a.label}</b>{a.is_default && <span><CheckCircle2 /> DEFAULT</span>}</div>
                    <h3>{a.recipient_name || profile.full_name}</h3>
                    <p>{[a.line1,a.line2,a.city,a.state,a.pincode].filter(Boolean).join(", ")}</p>
                    <p>{a.phone || profile.phone}</p>
                    <div>
                      {!a.is_default && <button onClick={() => makeDefault(a.id)}>MAKE DEFAULT</button>}
                      <button onClick={() => removeAddress(a.id)}><Trash2 /> REMOVE</button>
                    </div>
                  </article>
                ))}
              </div>

              <form className="customer-profile-form" onSubmit={addAddress}>
                <div className="customer-form-section">
                  <h2><Plus /> Add New Address</h2>
                  <div className="customer-form-grid">
                    <label>Label<input value={newAddress.label} onChange={(e) => setNewAddress({...newAddress,label:e.target.value})} placeholder="Home / Work / Parents" /></label>
                    <label>Recipient Name<input value={newAddress.recipient_name} onChange={(e) => setNewAddress({...newAddress,recipient_name:e.target.value})} placeholder={profile.full_name} /></label>
                    <label>Mobile Number<input value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress,phone:e.target.value})} placeholder={profile.phone} /></label>
                    <label className="wide">Address Line 1<input required value={newAddress.line1} onChange={(e) => setNewAddress({...newAddress,line1:e.target.value})} /></label>
                    <label className="wide">Apartment / Landmark<input value={newAddress.line2} onChange={(e) => setNewAddress({...newAddress,line2:e.target.value})} /></label>
                    <label>City<input required value={newAddress.city} onChange={(e) => setNewAddress({...newAddress,city:e.target.value})} /></label>
                    <label>State<input required value={newAddress.state} onChange={(e) => setNewAddress({...newAddress,state:e.target.value})} /></label>
                    <label>PIN Code<input required inputMode="numeric" pattern="[0-9]{6}" value={newAddress.pincode} onChange={(e) => setNewAddress({...newAddress,pincode:e.target.value})} /></label>
                  </div>
                </div>
                <button className="customer-save" disabled={saving}>{saving ? "SAVING..." : "SAVE ADDRESS"}</button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
