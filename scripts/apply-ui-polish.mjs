import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error("UI polish patch could not find " + label);
  return source.replace(search, replacement);
}

const storePath = "app/storefront.tsx";
let store = fs.readFileSync(storePath, "utf8");
store = replaceOnce(store,
  '<div className="product-grid">',
  '<div className="catalog-results">\n            <div className="product-grid">',
  "catalog product grid");
store = replaceOnce(store,
  "            )}\n          </div>\n        </section>\n      )}",
  "            )}\n            </div>\n          </div>\n        </section>\n      )}",
  "catalog pagination wrapper");
fs.writeFileSync(storePath, store);

const adminPath = "app/admin/shipping-promo-manager.tsx";
let admin = fs.readFileSync(adminPath, "utf8");
const oldAdminRoot = '<div className="admin-panel" style={{ display: "grid", gap: 24 }}>';
const newAdminRoot = '<div className="admin-panel shipping-promo-manager" style={{ display: "grid", gap: 24 }}>\n      <div className="shipping-promo-heading">\n        <div>\n          <span className="shipping-promo-eyebrow">FULFILMENT & PROMOTIONS</span>\n          <h1>Shipping & Coupons</h1>\n          <p>Manage delivery charges, courier partners and customer offers in one place.</p>\n        </div>\n        <div className="shipping-promo-summary">\n          <div><strong>{companies.length}</strong><span>Courier partners</span></div>\n          <div><strong>{coupons.length}</strong><span>Coupons created</span></div>\n          <div><strong>{coupons.filter((c) => c.is_active).length}</strong><span>Active coupons</span></div>\n        </div>\n      </div>';
admin = replaceOnce(admin, oldAdminRoot, newAdminRoot, "shipping admin heading");
fs.writeFileSync(adminPath, admin);

const cssPath = "app/globals.css";
let css = fs.readFileSync(cssPath, "utf8");
const marker = "/* Shree Gauri catalogue and admin UI polish */";
if (!css.includes(marker)) {
  css += "\n\n" + marker + "\n" + [
    ".catalog-results{min-width:0;width:100%;display:flex;flex-direction:column;}",
    ".catalog-results .product-grid{width:100%;min-width:0;}",
    ".catalog-results .catalog-pagination{grid-column:auto;width:100%;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:14px 0 24px;padding:14px 16px;border:1px solid #eadfd5;border-radius:10px;background:#fff;box-sizing:border-box;}",
    ".catalog-results .catalog-pagination>button{min-height:36px;padding:8px 14px;border:1px solid #dfd1c4;border-radius:7px;background:#fff;color:#4b3529;font-size:12px;font-weight:700;white-space:nowrap;}",
    ".catalog-results .catalog-pagination>button:disabled{opacity:.4;cursor:not-allowed;}",
    ".catalog-results .catalog-page-numbers button{min-width:34px;min-height:34px;border:1px solid #e0d4c9;border-radius:7px;background:#fff;color:#4b3529;font-weight:700;}",
    ".catalog-results .catalog-page-numbers button.active{background:#4b1720;border-color:#4b1720;color:#fff;}",
    ".product-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:8px!important;width:100%;min-width:0;margin-top:12px;}",
    ".product-actions button,.buy button{display:flex;align-items:center;justify-content:center;min-width:0;max-width:100%;min-height:42px;padding:10px 8px;line-height:1.25;text-align:center;white-space:normal;overflow-wrap:anywhere;font-size:11px;font-weight:800;letter-spacing:.25px;border-radius:7px;}",
    ".product-actions button:first-child,.buy button:first-child{background:#4b1720;color:#fff;border:1px solid #4b1720;}",
    ".product-actions button.buy-now-site,.buy button.buy-now-site{background:#fff;color:#4b1720;border:1px solid #4b1720;}",
    ".buy{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px!important;width:100%;min-width:0;margin-top:14px;}",
    ".buy button{min-height:48px;font-size:12px;}",
    ".buy button:disabled{opacity:.45;cursor:not-allowed;}",
    "header .header-currency{display:flex;align-items:center;gap:6px;min-width:0;white-space:nowrap;font-size:11px;color:#5b463c;}",
    "header .header-currency select{max-width:92px;min-width:68px;padding:6px 20px 6px 7px;border:1px solid #dfd4ca;border-radius:7px;background:#fff;color:#4b3529;font-size:11px;}",
    ".shipping-promo-manager{width:100%;max-width:1280px;margin:0 auto;gap:20px!important;color:#342321;}",
    ".shipping-promo-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:8px 2px 16px;border-bottom:1px solid #eadfd5;}",
    ".shipping-promo-eyebrow{display:inline-block;margin-bottom:8px;color:#9a6a36;font-size:10px;font-weight:800;letter-spacing:1.6px;}",
    ".shipping-promo-heading h1{margin:0;color:#3d171b;font-family:Georgia,serif;font-size:clamp(25px,3vw,34px);font-weight:600;letter-spacing:-.5px;}",
    ".shipping-promo-heading p{margin:8px 0 0;color:#806e66;font-size:13px;line-height:1.6;}",
    ".shipping-promo-summary{display:grid;grid-template-columns:repeat(3,minmax(105px,1fr));gap:10px;min-width:min(420px,48%);}",
    ".shipping-promo-summary>div{display:flex;flex-direction:column;gap:5px;padding:13px 15px;border:1px solid #eee2d7;border-radius:10px;background:#fff;}",
    ".shipping-promo-summary strong{color:#4b1720;font-size:22px;line-height:1.1;font-weight:750;font-variant-numeric:tabular-nums;}",
    ".shipping-promo-summary span{color:#806f68;font-size:10px;font-weight:650;}",
    ".shipping-promo-manager>section{min-width:0;padding:22px 24px;border:1px solid #eadfd5;border-radius:13px;background:#fff;box-shadow:0 5px 20px rgba(60,35,25,.035);}",
    ".shipping-promo-manager>section h2{margin:0 0 18px;padding-bottom:13px;border-bottom:1px solid #f0e7df;color:#42191d;font-family:Georgia,serif;font-size:21px;font-weight:600;}",
    ".shipping-promo-manager>section h3{color:#4b2925;font-size:15px;font-weight:700;}",
    ".shipping-promo-manager .two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 18px;}",
    ".shipping-promo-manager label{display:flex;flex-direction:column;gap:7px;min-width:0;color:#65534c;font-size:12px;font-weight:650;}",
    ".shipping-promo-manager input:not([type=checkbox]),.shipping-promo-manager select,.shipping-promo-manager textarea{width:100%;min-width:0;min-height:42px;padding:10px 12px;border:1px solid #ded2c8;border-radius:8px;background:#fffdfb;color:#382824;font-size:13px;outline:none;box-sizing:border-box;}",
    ".shipping-promo-manager input:focus,.shipping-promo-manager select:focus,.shipping-promo-manager textarea:focus{border-color:#a77a4c;box-shadow:0 0 0 3px rgba(167,122,76,.12);}",
    ".shipping-promo-manager input[type=checkbox]{width:16px;height:16px;accent-color:#4b1720;}",
    ".shipping-promo-manager label:has(input[type=checkbox]){display:flex;flex-direction:row;align-items:center;gap:9px;margin-top:15px;color:#5f4b43;}",
    ".shipping-promo-manager section button{min-height:39px;padding:9px 15px;border:1px solid #4b1720;border-radius:8px;background:#4b1720;color:#fff;font-size:12px;font-weight:750;}",
    ".shipping-promo-manager section button:hover{filter:brightness(1.08);}",
    ".shipping-promo-manager section button:disabled{opacity:.45;cursor:not-allowed;}",
    ".shipping-promo-manager section table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;}",
    ".shipping-promo-manager section th{padding:12px 13px;background:#f8f3ee;color:#6b554b;text-align:left;font-size:10px;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;}",
    ".shipping-promo-manager section td{padding:12px 13px;border-bottom:1px solid #f0e8e1;color:#57443d;vertical-align:middle;}",
    ".shipping-promo-manager section tr:last-child td{border-bottom:0;}",
    ".shipping-promo-manager section>div:has(table){max-width:100%;overflow-x:auto;border:1px solid #eee4dc;border-radius:9px;}",
    ".shipping-promo-manager section p{color:#78665e;font-size:12px;}",
    "@media(max-width:760px){.shipping-promo-heading{align-items:stretch;flex-direction:column;gap:16px}.shipping-promo-summary{min-width:0;width:100%}.shipping-promo-manager>section{padding:17px 15px}.shipping-promo-manager .two{grid-template-columns:1fr;gap:13px}.catalog-results .catalog-pagination{justify-content:center;gap:8px;padding:10px}.catalog-results .catalog-pagination>button{flex:1;min-width:72px}.catalog-results .catalog-page-numbers{order:3;width:100%}.buy{gap:8px!important}.buy button{min-height:46px;padding:9px 6px;font-size:10px}}",
    "@media(max-width:420px){.shipping-promo-summary{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.shipping-promo-summary>div{padding:10px 8px}.shipping-promo-summary strong{font-size:19px}.shipping-promo-summary span{font-size:9px}.product-actions{gap:6px!important}.product-actions button{min-height:40px;padding:8px 5px;font-size:9px}header .header-currency span{display:none}header .header-currency select{max-width:78px;min-width:62px}}",
  ].join("\n") + "\n";
}
fs.writeFileSync(cssPath, css);
console.log("Applied Shree Gauri storefront and shipping admin polish.");