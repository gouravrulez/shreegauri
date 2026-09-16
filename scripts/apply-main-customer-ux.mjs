import fs from "node:fs";

const storefrontPath = "app/storefront.tsx";
const cssPath = "app/globals.css";
let text = fs.readFileSync(storefrontPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

function replaceOnce(needle, replacement, label) {
  if (text.includes(replacement)) return;
  if (!text.includes(needle)) throw new Error(`Main customer UX patch failed: ${label}`);
  text = text.replace(needle, replacement);
}

replaceOnce(
`    [cart, setCart] = useState<P[]>(() => {`,
`    [cartNotice, setCartNotice] = useState(""),
    [cart, setCart] = useState<P[]>(() => {`,
"cart notice state"
);

const helperAnchor = `  async function openSecureCheckout() {`;
const helper = `  function confirmAddedToCart(productName: string, quantity = 1) {
    setCartNotice(\`${'${quantity}'} × ${'${productName}'} added to cart successfully.\`);
    window.setTimeout(() => setCartNotice(""), 2800);
  }

  async function openSecureCheckout() {`;
if (!text.includes("function confirmAddedToCart(")) {
  if (!text.includes(helperAnchor)) throw new Error("Main customer UX patch failed: cart helper");
  text = text.replace(helperAnchor, helper);
}

replaceOnce(
`                        <button onClick={() => setCart((c) => [...c, p])}>
                          ADD TO CART
                        </button>`,
`                        <button onClick={() => {
                          setCart((c) => [...c, p]);
                          confirmAddedToCart(p.name);
                        }}>
                          ADD TO CART
                        </button>`,
"product-card cart confirmation"
);

replaceOnce(
`                    setCart((c) => [...c, ...Array(qty).fill(item)]);
                    setItem(null);`,
`                    setCart((c) => [...c, ...Array(qty).fill(item)]);
                    confirmAddedToCart(item.name, qty);
                    setItem(null);`,
"product-detail cart confirmation"
);

const mainAnchor = `    <main>`;
const mainReplacement = `    <main>
      {cartNotice && (
        <div className="sg-cart-toast" role="status" aria-live="polite">
          <span>✓</span>
          <div><b>Added to cart</b><small>{cartNotice}</small></div>
          <button type="button" onClick={() => { setCartNotice(""); go("cart"); }}>VIEW CART</button>
        </div>
      )}`;
if (!text.includes("className=\"sg-cart-toast\"")) {
  if (!text.includes(mainAnchor)) throw new Error("Main customer UX patch failed: toast mount");
  text = text.replace(mainAnchor, mainReplacement);
}

fs.writeFileSync(storefrontPath, text);

if (!css.includes("Shree Gauri responsive cart confirmation")) {
  css += `
/* Shree Gauri responsive cart confirmation + desktop/mobile sync */
.sg-cart-toast{position:fixed;top:92px;right:18px;z-index:9999;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;width:min(440px,calc(100vw - 36px));padding:13px 14px;background:#fff;border:1px solid #d8c7b7;box-shadow:0 14px 38px rgba(47,24,20,.18);border-radius:10px;color:#3f1718}.sg-cart-toast>span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#edf7ee;font-weight:900}.sg-cart-toast div{min-width:0;display:flex;flex-direction:column;gap:2px}.sg-cart-toast b{font-size:13px}.sg-cart-toast small{font-size:11px;line-height:1.35;color:#6f5c57;white-space:normal;overflow-wrap:anywhere}.sg-cart-toast button{border:0;background:#4b0b10;color:#fff;padding:9px 10px;font-size:10px;font-weight:800;white-space:nowrap;border-radius:5px}
.product-grid article,.product-grid article .info{min-width:0}.product-grid article .info>div,.buy{display:flex;gap:8px;align-items:stretch;flex-wrap:wrap}.product-grid article .info>div>* ,.buy>*{min-width:0;flex:1 1 120px;text-align:center;box-sizing:border-box}.checkout-modal,.modal,.product-detail{max-width:calc(100vw - 24px);box-sizing:border-box}.checkout-grid>*{min-width:0}.checkout-grid input,.checkout-grid select{max-width:100%;box-sizing:border-box}
@media(max-width:760px){.sg-cart-toast{top:auto;right:10px;left:10px;bottom:82px;width:auto;grid-template-columns:auto minmax(0,1fr);gap:9px;padding:11px 12px}.sg-cart-toast button{grid-column:1/-1;width:100%}.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.product-grid article .info{padding-left:8px!important;padding-right:8px!important}.product-grid article .info>div{display:grid!important;grid-template-columns:1fr 1fr;gap:6px}.product-grid article .info>div>*{width:100%;min-width:0!important;padding-left:5px!important;padding-right:5px!important;font-size:10px!important;white-space:nowrap}.buy{display:grid!important;grid-template-columns:1fr 1fr;gap:7px}.buy>*{width:100%;min-width:0!important}.checkout-grid{grid-template-columns:1fr!important}.checkout-modal{width:calc(100vw - 20px)!important;max-height:90vh;overflow:auto}.product-detail{width:calc(100vw - 20px)!important;max-height:92vh;overflow:auto}.gallery-main{max-width:100%;height:auto}.wa{max-width:calc(100vw - 24px)}}
@media(max-width:380px){.product-grid article .info>div{grid-template-columns:1fr}.buy{grid-template-columns:1fr}.sg-cart-toast{bottom:72px}}
`;
  fs.writeFileSync(cssPath, css);
}

console.log("Shree Gauri responsive cart confirmation UX applied.");
