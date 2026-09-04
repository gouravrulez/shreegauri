import fs from "node:fs";

const storefrontPath = "app/storefront.tsx";
const cssPath = "app/globals.css";
let text = fs.readFileSync(storefrontPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function replaceOnce(needle, replacement, label) {
  if (text.includes(replacement)) return;
  if (!text.includes(needle)) throw new Error(`Customer checkout patch failed: ${label}`);
  text = text.replace(needle, replacement);
}

replaceOnce(
`type Checkout = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};`,
`type Checkout = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
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
};`,
"saved address type"
);

replaceOnce(
`    [cart, setCart] = useState<P[]>([]),`,
`    [cart, setCart] = useState<P[]>(() => {
      if (typeof window === "undefined") return [];
      try { return JSON.parse(localStorage.getItem("sg_cart") || "[]"); } catch { return []; }
    }),`,
"persisted cart"
);

replaceOnce(
`    [checkoutMsg, setCheckoutMsg] = useState(""),
    [checkout, setCheckout] = useState<Checkout>({`,
`    [checkoutMsg, setCheckoutMsg] = useState(""),
    [checkoutAddresses, setCheckoutAddresses] = useState<SavedAddress[]>([]),
    [selectedAddressId, setSelectedAddressId] = useState(""),
    [checkout, setCheckout] = useState<Checkout>({`,
"checkout address state"
);

const effectNeedle = `  const money = (n: number) =>`;
const effectReplacement = `  useEffect(() => {
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
    }));
  }

  const money = (n: number) =>`;
if (!text.includes("async function openSecureCheckout()")) {
  if (!text.includes(effectNeedle)) throw new Error("Customer checkout patch failed: helper insertion");
  text = text.replace(effectNeedle, effectReplacement);
}

replaceOnce(
`  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (!cart.length) return;
    setCheckoutBusy(true);`,
`  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (!cart.length) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem("sg_cart", JSON.stringify(cart));
      window.location.href = "/login?returnTo=checkout";
      return;
    }
    setCheckoutBusy(true);`,
"login enforcement"
);

replaceOnce(
`        headers: { "Content-Type": "application/json" },`,
`        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${session.access_token}\`,
        },`,
"auth header"
);

replaceOnce(
`                onClick={() => setCheckoutOpen(true)}
              >
                PLACE ORDER`,
`                onClick={openSecureCheckout}
              >
                PLACE ORDER`,
"cart checkout login gate"
);

replaceOnce(
`              Enter your delivery address, then complete payment securely
              through Razorpay.`,
`              Select a saved delivery address or enter another address, then complete payment securely through PhonePe.`,
"checkout provider copy"
);

replaceOnce(
`            <div className="checkout-grid">`,
`            {checkoutAddresses.length > 0 && (
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
            <div className="checkout-grid">`,
"saved address selector"
);

fs.writeFileSync(storefrontPath, text);

const styles = `
/* Shree Gauri OTP + saved addresses + account checkout */
.otp-channel{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 18px}.otp-channel button{padding:11px;border:1px solid #d8c8b8;background:#fff;color:#4b1718}.otp-channel button.active{background:#4b0b10;color:#fff}
.sg-address-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:20px}.sg-address-card{background:#fff;border:1px solid #e3d7ca;padding:20px}.sg-address-card.default{border-color:#b67c1b}.sg-address-card>div:first-child{display:flex;justify-content:space-between;gap:12px}.sg-address-card>div:first-child span{font-size:11px;color:#8a5a0e;display:flex;align-items:center;gap:5px}.sg-address-card h3{margin:12px 0 6px}.sg-address-card p{margin:5px 0;color:#6f5c57}.sg-address-card>div:last-child{display:flex;gap:8px;margin-top:14px}.sg-address-card button{border:1px solid #4b0b10;background:#fff;color:#4b0b10;padding:9px 11px;font-weight:700;display:flex;gap:5px;align-items:center}.sg-address-card button svg{width:15px}
.checkout-address-select{display:flex;flex-direction:column;gap:7px;margin:12px 0;font-weight:800;font-size:12px}.checkout-address-select select{padding:12px;border:1px solid #d9cabe;background:#fff}.checkout-account-note{font-size:12px;color:#755f58}.checkout-account-note a{font-weight:800;color:#7b1420}
@media(max-width:760px){.sg-address-list{grid-template-columns:1fr}}
`;
if (!css.includes("Shree Gauri OTP + saved addresses + account checkout")) {
  fs.appendFileSync(cssPath, styles);
}
console.log("Shree Gauri OTP, saved-address and mandatory-login checkout upgrade applied.");
