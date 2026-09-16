import fs from "node:fs";

const storePath="app/storefront.tsx";
const loginPath="app/login/customer-login.tsx";
const cssPath="app/globals.css";
let store=fs.readFileSync(storePath,"utf8");
let login=fs.readFileSync(loginPath,"utf8");
let css=fs.readFileSync(cssPath,"utf8");

function rep(text,from,to,label){
  if(text.includes(to)) return text;
  if(!text.includes(from)) throw new Error(`Dashboard/Buy Now patch failed: ${label}`);
  return text.replace(from,to);
}

// BUY NOW must use the website's authenticated secure checkout, never WhatsApp.
const cardWa=`                        <a\n                          href={wa(\n                            \`Hello Shree Gauri, I want to buy \${p.name}.\`,\n                          )}\n                        >\n                          BUY NOW\n                        </a>`;
const cardCheckout=`                        <button\n                          className="buy-now-site"\n                          onClick={() => { setCart([p]); setTimeout(() => openSecureCheckout(), 0); }}\n                        >\n                          BUY NOW\n                        </button>`;
store=rep(store,cardWa,cardCheckout,"product-card Buy Now");

const modalWa=`                <a\n                  href={wa(\n                    \`Hello Shree Gauri, I want to buy \${qty} × \${item.name}.\`,\n                  )}\n                >\n                  BUY NOW\n                </a>`;
const modalCheckout=`                <button\n                  className="buy-now-site"\n                  onClick={() => { const chosen=[...Array(qty).fill(item)]; setCart(chosen); setItem(null); setTimeout(() => openSecureCheckout(), 0); }}\n                >\n                  BUY NOW\n                </button>`;
store=rep(store,modalWa,modalCheckout,"product-detail Buy Now");

// Dashboard: add useful commerce shortcuts and clearer order status without changing data model.
login=rep(login,
`  UserRound, Package, MapPin, LogOut, ShoppingBag, Truck, Home,\n  Plus, Trash2, CheckCircle2`,
`  UserRound, Package, MapPin, LogOut, ShoppingBag, Truck, Home,\n  Plus, Trash2, CheckCircle2, Heart, Headphones, ChevronRight, CreditCard`,
"dashboard icons");

login=rep(login,
`          <button className={section === "addresses" ? "active" : ""} onClick={() => setSection("addresses")}><MapPin /> Saved Addresses</button>\n          <a href="/"><ShoppingBag /> Continue Shopping</a>`,
`          <button className={section === "addresses" ? "active" : ""} onClick={() => setSection("addresses")}><MapPin /> Saved Addresses</button>\n          <a href="/?view=wishlist"><Heart /> Wishlist</a>\n          <a href="/"><ShoppingBag /> Continue Shopping</a>`,
"wishlist shortcut");

login=rep(login,
`              <div className="customer-summary-grid">`,
`              <div className="customer-account-actions">\n                <button onClick={() => setSection("orders")}><Package /><span><b>Track Orders</b><small>See payment, fulfilment and delivery status</small></span><ChevronRight /></button>\n                <button onClick={() => setSection("addresses")}><MapPin /><span><b>Delivery Addresses</b><small>Manage your default and saved addresses</small></span><ChevronRight /></button>\n                <button onClick={() => setSection("profile")}><UserRound /><span><b>Account Details</b><small>Keep your contact information updated</small></span><ChevronRight /></button>\n                <a href="/contact"><Headphones /><span><b>Customer Support</b><small>Shree Gauri support is available 24/7</small></span><ChevronRight /></a>\n              </div>\n              <div className="customer-summary-grid">`,
"dashboard action cards");

login=rep(login,
`                    <span>{statusLabel(o.order_status)}</span>\n                    <strong>₹{Number(o.total_inr).toLocaleString("en-IN")}</strong>`,
`                    <span className={\`order-state order-state-\${o.order_status}\`}>{statusLabel(o.order_status)}</span>\n                    <div className="customer-order-payment"><small><CreditCard /> {statusLabel(o.payment_status)}</small><strong>₹{Number(o.total_inr).toLocaleString("en-IN")}</strong></div>`,
"recent order status");

if(!css.includes("/* SG dashboard parity + Buy Now fix */")) css += `\n/* SG dashboard parity + Buy Now fix */\n.buy-now-site{cursor:pointer}.customer-account-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 22px}.customer-account-actions>a,.customer-account-actions>button{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;text-align:left;background:#fff;border:1px solid #eadfd5;padding:16px;border-radius:12px;color:inherit;text-decoration:none}.customer-account-actions svg{width:20px}.customer-account-actions span{display:flex;flex-direction:column;gap:3px}.customer-account-actions small{font-size:11px;color:#755f58}.customer-order-payment{display:flex;align-items:flex-end;flex-direction:column;gap:5px}.customer-order-payment small{display:flex;align-items:center;gap:4px;font-size:10px}.customer-order-payment svg{width:13px}.order-state{font-weight:800}.order-state-delivered{color:#24743a}.order-state-cancelled,.order-state-failed{color:#a22525}@media(max-width:760px){.customer-account-actions{grid-template-columns:1fr}.customer-order-payment{align-items:flex-start}}\n`;

fs.writeFileSync(storePath,store);
fs.writeFileSync(loginPath,login);
fs.writeFileSync(cssPath,css);
console.log("Shree Gauri customer dashboard upgraded and Buy Now routed to secure website checkout.");