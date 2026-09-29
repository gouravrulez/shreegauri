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
const cardCheckout=`                        <button\n                          className="buy-now-site"\n                          onClick={() => { setCart([p]); setItem(null); window.setTimeout(() => openSecureCheckout(), 0); }}\n                        >\n                          BUY NOW\n                        </button>`;
store=rep(store,cardWa,cardCheckout,"product-card Buy Now");

const modalWa=`                <a\n                  href={wa(\n                    \`Hello Shree Gauri, I want to buy \${qty} × \${item.name}.\`,\n                  )}\n                >\n                  BUY NOW\n                </a>`;
const modalCheckout=`                <button\n                  className="buy-now-site"\n                  onClick={() => { const chosen=[...Array(qty).fill(item)]; setCart(chosen); setItem(null); window.setTimeout(() => openSecureCheckout(), 0); }}\n                >\n                  BUY NOW\n                </button>`;
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

if(!css.includes("/* SG premium mobile customer account 2026 */")) css += "\n/* SG premium mobile customer account 2026 */\n@media(max-width:760px){\n.customer-dashboard{background:linear-gradient(180deg,#fffaf5 0,#f7f0e9 100%)!important}\n.customer-dash-head{background:rgba(255,255,255,.96)!important;backdrop-filter:blur(14px);border-bottom:1px solid #eee1d5!important}\n.customer-brand{color:#6b1724!important;letter-spacing:1.2px!important}.customer-brand small{color:#a07852!important;letter-spacing:1.4px!important}\n.customer-dash-nav{top:64px!important;padding:10px 12px!important;gap:8px!important;box-shadow:0 8px 20px rgba(73,42,25,.05)!important}\n.customer-dash-nav button,.customer-dash-nav>a{min-height:40px!important;padding:9px 13px!important;background:#fffaf6!important;border-color:#ead9ca!important;color:#5f302c!important;font-weight:800!important}\n.customer-dash-nav button.active{background:#7b1420!important;color:#fff!important;border-color:#7b1420!important}\n.customer-dash-content{padding:20px 14px 92px!important}\n.customer-welcome{padding:8px 4px 16px!important}.customer-welcome>small,.customer-page-title>small{color:#b27b36!important;font-weight:900!important;letter-spacing:1.5px!important}.customer-welcome h1,.customer-page-title h1{font-size:27px!important;line-height:1.08!important;color:#43151b!important}.customer-welcome p,.customer-page-title p{color:#795f58!important;font-size:13px!important}\n.customer-summary-grid{gap:9px!important}.customer-summary-grid button{background:#fff!important;border:1px solid #eadfd5!important;border-radius:14px!important;box-shadow:0 8px 24px rgba(81,48,32,.05)!important}.customer-summary-grid button>svg{color:#9a6a2f!important}.customer-summary-grid button strong{color:#6b1724!important}\n.customer-panel,.customer-order-card,.customer-form-section,.sg-address-card{background:#fff!important;border:1px solid #eadfd5!important;border-radius:16px!important;box-shadow:0 10px 30px rgba(79,48,33,.055)!important}\n.customer-panel-title h2{color:#43151b!important}.customer-order-row{border-color:#f0e5dc!important}.customer-order-row>span{background:#fff3e5!important;color:#7b1420!important;padding:5px 8px!important;border-radius:999px!important;font-size:9px!important;font-weight:900!important}\n.customer-order-card{padding:0!important;overflow:hidden!important}.customer-order-top{padding:13px 14px!important;background:#fff8f1!important;border-bottom:1px solid #eee0d4!important}.customer-order-top small{font-size:8px!important;letter-spacing:.7px!important;color:#9a7a69!important}.customer-order-top b{font-size:12px!important;color:#4b2022!important}.customer-order-status{padding:15px 14px!important}.customer-order-status h3{font-size:18px!important;color:#541820!important}.customer-order-status>a{min-height:44px!important;display:grid!important;place-items:center!important;background:#7b1420!important;color:#fff!important;border-radius:10px!important;text-decoration:none!important;font-weight:900!important}.customer-order-items{padding:0 14px 12px!important}.customer-order-items>div{padding:11px 0!important;border-top:1px solid #f1e7df!important}.customer-tracking{margin:0 14px 14px!important;padding:10px!important;border-radius:10px!important;background:#f8f2ec!important}\n.customer-form-section h2{color:#541820!important}.customer-profile-form label{font-size:11px!important;font-weight:800!important;color:#624b45!important}.customer-profile-form input{border:1px solid #dfd1c5!important;border-radius:10px!important;background:#fff!important;padding:11px 12px!important}.customer-profile-form input:focus{outline:2px solid rgba(123,20,32,.15)!important;border-color:#7b1420!important}.customer-save{background:#7b1420!important;border-radius:11px!important;font-weight:900!important;letter-spacing:.5px!important}\n.customer-empty{padding:26px 12px!important;text-align:center!important}.customer-empty>a{display:inline-flex!important;min-height:42px!important;align-items:center!important;padding:0 16px!important;border-radius:10px!important;background:#7b1420!important;color:#fff!important;text-decoration:none!important}\n}\n";

fs.writeFileSync(storePath,store);
fs.writeFileSync(loginPath,login);
fs.writeFileSync(cssPath,css);
console.log("Shree Gauri customer dashboard upgraded and Buy Now routed to secure website checkout.");