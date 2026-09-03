import fs from "node:fs";

const adminPath = "app/admin/admin-dashboard.tsx";
const cssPath = "app/globals.css";
let admin = fs.readFileSync(adminPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function addOnce(needle, replacement, label) {
  if (admin.includes(replacement)) return;
  if (!admin.includes(needle)) throw new Error(`Customer admin patch failed: ${label}`);
  admin = admin.replace(needle, replacement);
}

addOnce(
  `  ClipboardList,
} from "lucide-react";`,
  `  ClipboardList,
  Users,
} from "lucide-react";`,
  "Users icon",
);

addOnce(
  `type Order = {`,
  `type Customer = {
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
type Order = {`,
  "customer type",
);

addOnce(
  `    [orders, setOrders] = useState<Order[]>([]),
    [settings, setSettings]`,
  `    [orders, setOrders] = useState<Order[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [settings, setSettings]`,
  "customer state",
);

addOnce(
  `    const [a, b, c, d, o] = await Promise.all([`,
  `    const [a, b, c, d, o, u] = await Promise.all([`,
  "load tuple",
);

const ordersQueryEnd = `      supabase
        .from("orders")
        .select("*,order_items(*)")
        .order("created_at", { ascending: false }),
    ]);`;

const ordersQueryReplacement = `      supabase
        .from("orders")
        .select("*,order_items(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);`;

if (!admin.includes(ordersQueryReplacement)) {
  if (!admin.includes(ordersQueryEnd)) throw new Error("Customer admin patch failed: load customers query");
  admin = admin.replace(ordersQueryEnd, ordersQueryReplacement);
}

addOnce(
  `    if (o.data) setOrders(o.data as Order[]);
  }`,
  `    if (o.data) setOrders(o.data as Order[]);
    if (u.data) setCustomers(u.data as Customer[]);
  }`,
  "set customers",
);

const orderButtonEnd = `        </button>
        <button
          className={tab === "categories" ? "on" : ""}`;

const customerButtonBlock = `        </button>
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
          className={tab === "categories" ? "on" : ""}`;

if (!admin.includes(`tab === "customers" ? "on" : ""`)) {
  if (!admin.includes(orderButtonEnd)) throw new Error("Customer admin patch failed: customers nav");
  admin = admin.replace(orderButtonEnd, customerButtonBlock);
}

addOnce(
  `              {tab === "orders"
                ? "Customer Orders"
                : tab === "categories"`,
  `              {tab === "orders"
                ? "Customer Orders"
                : tab === "customers"
                  ? "Customer Accounts"
                  : tab === "categories"`,
  "customer header",
);

const customersRender = `        {tab === "customers" && (
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
                        {c.email ? <a href={\`mailto:\${c.email}\`}>{c.email}</a> : <span>—</span>}
                        {c.phone ? <a href={\`tel:\${c.phone}\`}>{c.phone}</a> : <span>—</span>}
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
`;

if (!admin.includes(`className="customers-admin"`)) {
  const target = `        {tab === "orders" && (`;
  if (!admin.includes(target)) throw new Error("Customer admin patch failed: customer render");
  admin = admin.replace(target, customersRender + target);
}

fs.writeFileSync(adminPath, admin);

const styles = `
/* Shree Gauri customer account dashboard */
.customer-dashboard{min-height:100vh;background:#f6f1eb;color:#321014}
.customer-dash-head{min-height:78px;background:#2b0509;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:14px 5vw;border-bottom:3px solid #b67c1b}
.customer-brand{font:28px Georgia,serif;color:#efbd59;letter-spacing:.8px}.customer-brand small{display:block;font:11px Arial,sans-serif;color:#dbc5c5;margin-top:4px;letter-spacing:1.5px}
.customer-dash-head>div{display:flex;align-items:center;gap:24px}.customer-dash-head button{border:1px solid #ffffff40;background:transparent;color:#fff;padding:10px 13px;display:flex;gap:7px;align-items:center}.customer-dash-head svg{width:17px}.customer-return-store{border:1px solid #efbd59;color:#efbd59;padding:10px 13px;display:flex;gap:7px;align-items:center;font-weight:800;font-size:12px;white-space:nowrap}.customer-return-store:hover{background:#efbd59;color:#2b0509}
.customer-dash-layout{max-width:1450px;margin:auto;display:grid;grid-template-columns:270px 1fr;gap:28px;padding:34px 4vw 70px}
.customer-dash-nav{background:#fff;border:1px solid #e3d7ca;padding:24px;align-self:start;display:flex;flex-direction:column;gap:8px;position:sticky;top:18px}.customer-avatar{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#f0dfc7;color:#692316;margin-bottom:5px}.customer-avatar svg{width:28px}.customer-dash-nav>b{font-size:17px}.customer-dash-nav>small{color:#8a7470;margin-bottom:16px;overflow-wrap:anywhere}.customer-dash-nav button,.customer-dash-nav>a{border:0;background:transparent;text-align:left;padding:13px 12px;display:flex;gap:10px;align-items:center;color:#674f4d}.customer-dash-nav button.active{background:#3a080d;color:#fff}.customer-dash-nav svg{width:19px}
.customer-dash-content{min-width:0}.customer-welcome,.customer-page-title{background:#fff;padding:34px;border:1px solid #e3d7ca;margin-bottom:20px}.customer-welcome small,.customer-page-title small,.customer-panel-title small,.customer-form-section small{color:#a46816;letter-spacing:2px;font-weight:800}.customer-welcome h1,.customer-page-title h1{font:42px Georgia,serif;color:#481014;margin:7px 0 8px}.customer-welcome p,.customer-page-title p{color:#705c57;margin:0}
.account-message{background:#fff0cf;color:#6f4a0b;border:1px solid #e3c98d;padding:12px 15px}
.customer-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px}.customer-summary-grid button{border:1px solid #e3d7ca;background:#fff;padding:23px;text-align:left;display:flex;align-items:center;gap:17px}.customer-summary-grid svg{width:30px;height:30px;color:#aa711c}.customer-summary-grid span{display:flex;flex-direction:column;color:#7e6862}.customer-summary-grid strong{font-size:25px;color:#3a0b0e;margin-bottom:2px}
.customer-panel{background:#fff;border:1px solid #e3d7ca;padding:28px;margin-bottom:20px}.customer-panel-title{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}.customer-panel-title h2{font:28px Georgia,serif;color:#461015;margin:4px 0}.customer-panel-title button{border:0;background:none;color:#9b620e;font-weight:800}.customer-order-row{display:grid;grid-template-columns:1fr auto auto;gap:24px;align-items:center;padding:16px 0;border-top:1px solid #eee4db}.customer-order-row div{display:flex;flex-direction:column;gap:4px}.customer-order-row small{color:#8a7770}.customer-order-row span{background:#f3e5d4;padding:7px 10px;font-size:12px}
.account-detail-preview{display:grid;grid-template-columns:1fr 1fr;gap:20px}.account-detail-preview>div{display:flex;gap:14px}.account-detail-preview svg{color:#a76a18}.account-detail-preview span{display:flex;flex-direction:column;gap:4px}.account-detail-preview p{margin:0;color:#806d68}
.customer-empty{text-align:center;padding:45px 20px;color:#75605c}.customer-empty svg{width:44px;height:44px;color:#b9802e;margin:auto}.customer-empty h3{font:25px Georgia,serif;color:#491115;margin:12px 0 5px}.customer-empty a{display:inline-block;margin-top:12px;background:#3b080d;color:#fff;padding:12px 17px;font-weight:800}
.customer-orders-list{display:flex;flex-direction:column;gap:18px}.customer-order-card{background:#fff;border:1px solid #e3d7ca}.customer-order-top{background:#f4ede5;display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:20px;padding:16px 22px}.customer-order-top>div{display:flex;flex-direction:column;gap:4px}.customer-order-top small{font-size:10px;color:#8a746c;letter-spacing:1px}.customer-order-status{padding:24px 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee4dc}.customer-order-status>div{display:flex;gap:12px;align-items:flex-start}.customer-order-status h3{margin:3px 0;font:25px Georgia,serif}.customer-order-status p{margin:0;color:#806e68}.status-dot{width:12px;height:12px;border-radius:50%;background:#a56b17;margin-top:8px}.status-dot.delivered{background:#16824a}.status-dot.cancelled,.status-dot.failed{background:#ae2630}.customer-order-status>a{background:#3b080d;color:#fff;padding:11px 14px;font-weight:800;font-size:12px}.customer-order-items{padding:5px 22px 14px}.customer-order-items>div{display:flex;justify-content:space-between;gap:20px;padding:15px 0;border-bottom:1px solid #f0e8e0}.customer-order-items span{display:flex;flex-direction:column;gap:3px}.customer-order-items small{color:#8b7770}.customer-tracking{display:flex;gap:8px;align-items:center;padding:14px 22px;background:#fff7e8}.customer-tracking svg{width:18px}
.customer-profile-form{display:flex;flex-direction:column;gap:18px}.customer-form-section{background:#fff;border:1px solid #e3d7ca;padding:28px}.customer-form-section h2{font:25px Georgia,serif;color:#491015;margin:0 0 22px;display:flex;gap:9px;align-items:center}.customer-form-section h2 svg{width:22px;color:#a56b19}.customer-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.customer-form-grid label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:800;color:#69524f}.customer-form-grid label.wide{grid-column:1/-1}.customer-form-grid input{border:1px solid #d9cabe;background:#fff;padding:13px;outline-color:#ac751f}.customer-form-grid input:disabled{background:#f3eee9;color:#8a7b76}.customer-save{align-self:flex-start;border:0;background:#3c080d;color:#fff;padding:14px 24px;font-weight:800}
.customers-admin{display:flex;flex-direction:column;gap:18px}.customer-admin-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.customer-admin-summary>div{background:#fff;border:1px solid #e2d7cc;padding:20px;display:flex;flex-direction:column;gap:6px}.customer-admin-summary small{color:#8d766d;letter-spacing:1px}.customer-admin-summary strong{font-size:28px;color:#461015}.customer-admin-list{display:flex;flex-direction:column;gap:12px}.customer-admin-card{background:#fff;border:1px solid #e2d7cc;padding:22px}.customer-admin-head{display:flex;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:1px solid #eee3da}.customer-admin-head h2{font:25px Georgia,serif;margin:7px 0;color:#481014}.account-live,.account-guest{display:inline-block;font-size:10px;font-weight:800;letter-spacing:1px;padding:5px 8px}.account-live{background:#def2e5;color:#1d6b3d}.account-guest{background:#eee8e2;color:#715d56}.customer-admin-metrics{display:flex;gap:20px;align-items:center}.customer-admin-metrics span{display:flex;flex-direction:column;color:#7d6963;text-align:right}.customer-admin-metrics b{color:#3d0b0f;font-size:18px}.customer-admin-grid{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:22px;padding:18px 0}.customer-admin-grid>div{display:flex;flex-direction:column;gap:6px}.customer-admin-grid small,.customer-admin-orders>small{color:#a26c1d;letter-spacing:1.5px;font-weight:800}.customer-admin-grid a{color:#3f0c10}.customer-admin-grid span{color:#76615c}.customer-admin-orders{border-top:1px solid #eee3da;padding-top:14px;display:flex;flex-direction:column;gap:7px}.customer-admin-orders span{display:flex;justify-content:space-between;color:#715d58}
@media(max-width:900px){.customer-dash-head{padding:12px 16px}.customer-dash-head>div>span{display:none}.customer-brand{font-size:22px}.customer-dash-layout{grid-template-columns:1fr;padding:16px 12px 50px}.customer-dash-nav{position:static;display:grid;grid-template-columns:repeat(2,1fr)}.customer-avatar,.customer-dash-nav>b,.customer-dash-nav>small{display:none}.customer-dash-nav button,.customer-dash-nav>a{font-size:12px;padding:12px 9px}.customer-summary-grid{grid-template-columns:1fr}.customer-welcome h1,.customer-page-title h1{font-size:32px}.customer-welcome,.customer-page-title,.customer-panel,.customer-form-section{padding:20px}.account-detail-preview{grid-template-columns:1fr}.customer-order-top{grid-template-columns:1fr 1fr;padding:14px}.customer-order-top>div:last-child{grid-column:1/-1}.customer-order-status{align-items:flex-start;gap:15px;flex-direction:column}.customer-order-items{padding:5px 14px 12px}.customer-form-grid{grid-template-columns:1fr}.customer-form-grid label.wide{grid-column:auto}.customer-admin-summary{grid-template-columns:1fr}.customer-admin-head{flex-direction:column}.customer-admin-metrics{justify-content:flex-start}.customer-admin-metrics span{text-align:left}.customer-admin-grid{grid-template-columns:1fr}.customer-admin-orders span{flex-direction:column;gap:2px}}
`;

if (!css.includes("/* Shree Gauri customer account dashboard */")) {
  css += styles;
  fs.writeFileSync(cssPath, css);
}

console.log("Customer dashboard and admin customer centre applied.");
