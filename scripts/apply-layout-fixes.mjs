import fs from "node:fs";
const cssPath = "app/globals.css";
const adminPath = "app/admin/admin-dashboard.tsx";
const shippingPath = "app/admin/shipping-promo-manager.tsx";

function replaceRequired(path, before, after) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error("Layout patch target not found in " + path);
  source = source.replace(before, after);
  fs.writeFileSync(path, source);
}

replaceRequired(
  adminPath,
  '<section style={{ border: "1px solid #e7d9ce", borderRadius: 12, padding: 16, marginTop: 8, display: "grid", gap: 12 }}>',
  '<section className="customer-product-options" style={{ border: "1px solid #e7d9ce", borderRadius: 12, padding: 16, marginTop: 8, display: "grid", gap: 12 }}>'
);
replaceRequired(
  shippingPath,
  'className="admin-panel" style={{display:"grid",gap:24}}',
  'className="admin-panel shipping-promo-manager" style={{display:"grid",gap:24}}'
);

const styles = `

/* Shree Gauri layout refinements: contained pagination and balanced purchase actions. */
.catalog-view-switch{position:relative!important;top:auto!important;z-index:1!important}
.catalog-pagination{position:relative!important;z-index:1!important;clear:both!important;float:none!important;inset:auto!important;transform:none!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;display:flex!important;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:16px 0 10px!important;padding:12px!important}
.catalog-page-buttons{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;min-width:0;max-width:100%}
.catalog-page-buttons button{min-width:34px;min-height:34px;padding:7px 10px;white-space:nowrap}
.catalog-pagination>label{min-width:0;flex-wrap:wrap}
.product-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:stretch;gap:8px!important;width:100%;min-width:0;margin-top:12px}
.product-actions button{box-sizing:border-box;width:100%!important;min-width:0!important;max-width:100%;min-height:40px;padding:9px 8px!important;white-space:normal;overflow-wrap:anywhere;line-height:1.2;font-size:11px!important;letter-spacing:.2px}
.product-actions .buy-now-site{margin:0!important}
.shipping-promo-manager{gap:18px!important;min-width:0;width:100%}
.shipping-promo-manager>section{box-sizing:border-box;min-width:0;padding:20px!important;border:1px solid #e9dfd5;border-radius:12px;background:#fff;box-shadow:0 2px 10px rgba(61,34,20,.035)}
.shipping-promo-manager>section h2{margin:0 0 16px;color:#4b1720;font-size:17px;line-height:1.35;font-weight:750}
.shipping-promo-manager .two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;align-items:start}
.shipping-promo-manager label{display:flex;flex-direction:column;gap:6px;min-width:0;color:#59463d;font-size:12px;font-weight:650}
.shipping-promo-manager input,.shipping-promo-manager select{box-sizing:border-box;width:100%;min-width:0;min-height:40px;padding:9px 11px;border:1px solid #dcd0c5;border-radius:7px;background:#fff;color:#35251f;font-size:13px}
.shipping-promo-manager input:focus,.shipping-promo-manager select:focus{outline:2px solid rgba(150,112,65,.2);border-color:#a9855c}
.shipping-promo-manager button{min-height:38px;padding:9px 14px;border:1px solid #4b1720;border-radius:7px;background:#4b1720;color:#fff;font-size:12px;font-weight:700;cursor:pointer}
.shipping-promo-manager ul{display:grid;gap:9px;margin:14px 0 0;padding:0;list-style:none}
.shipping-promo-manager li{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding:12px;border:1px solid #eee5dc;border-radius:8px;background:#fffdfa;font-size:13px}
.shipping-promo-manager li>*{min-width:0}
.shipping-promo-manager li button{flex:0 0 auto;min-height:32px;padding:6px 10px;background:#fff;color:#8b3030;border-color:#e5c9c5}
.customer-product-options{box-sizing:border-box;min-width:0;width:100%;background:#fffdf9!important;border-color:#e8ddd2!important}
.customer-product-options h3{color:#4b1720;font-size:15px;line-height:1.35}
.customer-product-options>label:not(.check){display:grid;grid-template-columns:minmax(0,1fr);gap:6px;color:#59463d;font-size:12px;font-weight:650}
.customer-product-options input:not([type=checkbox]),.customer-product-options select{box-sizing:border-box;width:100%;min-width:0;min-height:38px;padding:8px 10px;border:1px solid #dcd0c5;border-radius:7px;background:#fff}
.customer-product-options>.check{display:flex;align-items:flex-start;gap:9px;min-width:0;padding:10px 12px;border:1px solid #eee5dc;border-radius:8px;background:#fff;font-size:12px;line-height:1.4}
.customer-product-options>.check input{flex:0 0 auto;margin-top:2px}
.customer-product-options>div{min-width:0;max-width:100%}
@media(max-width:680px){.catalog-pagination{flex-direction:column;align-items:stretch!important}.catalog-page-buttons{justify-content:center;width:100%}.product-actions{gap:6px!important}.product-actions button{min-height:38px;padding:8px 5px!important;font-size:10px!important}.shipping-promo-manager>section{padding:15px!important}.shipping-promo-manager .two{grid-template-columns:minmax(0,1fr)}.shipping-promo-manager li{align-items:flex-start;flex-wrap:wrap}.customer-product-options{padding:12px!important}.customer-product-options>.check{padding:9px}.customer-product-options input:not([type=checkbox]),.customer-product-options select{font-size:16px}}

/* Hard-stop overlap correction: catalogue controls must never cover the site header/search. */
.catalog-toolbar{position:relative!important;top:auto!important;z-index:1!important;isolation:auto!important;margin-top:20px!important}
.catalog-layout .filters{position:relative!important;top:auto!important;max-height:none!important;overflow:visible!important}
.catalog-pagination{position:relative!important;inset:auto!important;float:none!important;clear:both!important;transform:none!important;z-index:1!important;display:flex!important;grid-column:1 / -1!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:16px 0!important;padding:12px!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between!important;gap:12px!important}
.records.product-card-grid>.catalog-pagination{grid-column:1 / -1!important;align-self:stretch!important}
.catalog-pagination>label,.catalog-pagination>.catalog-page-count,.catalog-pagination>.catalog-page-buttons{position:static!important;float:none!important;transform:none!important;min-width:0!important;max-width:100%!important}
.catalog-page-buttons{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important}
.admin .catalog-view-switch{position:relative!important;top:auto!important;z-index:1!important;isolation:auto!important}
@media(max-width:900px){
 .catalog-toolbar{position:relative!important;top:auto!important;z-index:1!important;margin-top:20px!important}
 .catalog-layout .filters{position:fixed!important;inset:0 auto 0 0!important;top:0!important;max-height:none!important;overflow-y:auto!important;z-index:102!important}
 .catalog-pagination{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;gap:10px!important;width:100%!important;margin:14px 0!important}
 .catalog-pagination>label{justify-content:center!important;margin:0!important}
 .catalog-page-count{width:100%!important;text-align:center!important;order:0!important}
 .catalog-page-buttons{width:100%!important;justify-content:center!important}
 .admin .catalog-view-switch{position:relative!important;top:auto!important;z-index:1!important}
}

/* Header currency selector gets a reserved column; it must not push into search. */
header{grid-template-columns:minmax(210px,270px) minmax(260px,1fr) minmax(340px,auto)!important;column-gap:16px!important;padding-left:3vw!important;padding-right:3vw!important}
.head-actions{min-width:0!important;gap:10px!important;white-space:nowrap}
.header-currency{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important;white-space:nowrap!important;font-size:10px!important}
.header-currency select{box-sizing:border-box!important;width:76px!important;max-width:76px!important;min-width:0!important;padding:7px 5px!important;border:1px solid #d8c9bc!important;border-radius:6px!important;background:#fff!important;color:#3f2224!important;font-size:11px!important}
@media(min-width:901px) and (max-width:1180px){
 header{grid-template-columns:minmax(190px,220px) minmax(180px,1fr) minmax(300px,auto)!important;column-gap:10px!important;padding-left:2vw!important;padding-right:2vw!important}
 .head-actions{gap:6px!important}
 .head-actions a,.head-actions button{gap:4px!important;font-size:11px!important}
 .header-currency select{width:66px!important;max-width:66px!important}
}
@media(max-width:900px){
 header{grid-template-columns:42px minmax(0,1fr) auto!important;padding:0 12px!important}
 .head-actions{gap:3px!important}
 .header-currency{gap:3px!important}
 .header-currency span{display:none!important}
 .header-currency select{width:64px!important;max-width:64px!important;padding:6px 3px!important;font-size:10px!important}
}

`;
const css = fs.readFileSync(cssPath, "utf8");
if (!css.includes("Shree Gauri layout refinements: contained pagination")) {
  fs.writeFileSync(cssPath, css + styles);
}
console.log("Applied Shree Gauri layout refinements.");
