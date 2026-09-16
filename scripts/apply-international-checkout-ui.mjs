import fs from "node:fs";

const path = "app/storefront.tsx";
let text = fs.readFileSync(path, "utf8");
const replace = (from, to, label) => {
  if (text.includes(to)) return;
  if (!text.includes(from)) throw new Error(`International checkout patch failed: ${label}`);
  text = text.replace(from, to);
};

replace(`import { supabase } from "./lib/supabase";`,`import { supabase } from "./lib/supabase";\nimport { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountry, canUsePhonePe, INTERNATIONAL_PAYMENT_MESSAGE } from "./lib/global-commerce";`,`global commerce import`);
replace(`  pincode: string;\n};\ntype SavedAddress = {`,`  pincode: string;\n  country_code: string;\n  phone_country_code: string;\n};\ntype SavedAddress = {`,`checkout international fields`);
replace(`      pincode: "",\n    });`,`      pincode: "",\n      country_code: DEFAULT_COUNTRY.code,\n      phone_country_code: DEFAULT_COUNTRY.dialCode,\n    });`,`checkout defaults`);
replace(`      pincode: chosen?.pincode || "",\n    });`,`      pincode: chosen?.pincode || "",\n      country_code: DEFAULT_COUNTRY.code,\n      phone_country_code: DEFAULT_COUNTRY.dialCode,\n    });`,`saved address defaults`);
replace(`      pincode: a.pincode,\n    }));`,`      pincode: a.pincode,\n      country_code: DEFAULT_COUNTRY.code,\n      phone_country_code: DEFAULT_COUNTRY.dialCode,\n    }));`,`saved address selection`);
replace(`    setCheckoutBusy(true);`,`    if (!canUsePhonePe(checkout.country_code)) {\n      setCheckoutMsg(INTERNATIONAL_PAYMENT_MESSAGE);\n      return;\n    }\n    setCheckoutBusy(true);`,`international payment guard`);
replace(`            <div className="checkout-grid">`,`            <div className="checkout-grid">\n              <label>Country\n                <select value={checkout.country_code} onChange={(e) => { const country = getCountry(e.target.value); setCheckout((c) => ({ ...c, country_code: country.code, phone_country_code: country.dialCode })); }}>\n                  {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}\n                </select>\n              </label>\n              <label>Phone code\n                <select value={checkout.phone_country_code} onChange={(e) => setCheckout((c) => ({ ...c, phone_country_code: e.target.value }))}>\n                  {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.dialCode}>{country.name} ({country.dialCode})</option>)}\n                </select>\n              </label>`,`country and phone selectors`);
replace(`              Select a saved delivery address or enter another address, then complete payment securely through PhonePe.`,`              Select a saved delivery address or enter another address. India orders can complete payment securely through PhonePe. International customers can enter their delivery details and contact Shree Gauri for shipping and payment assistance.`,`international checkout copy`);

// Display-currency layer only. Server/order values remain INR.
replace(`    [q, setQ] = useState(""),`,`    [q, setQ] = useState(""),\n    [displayCurrency, setDisplayCurrency] = useState("INR"),`,`currency state`);
const oldMoney = `  const money = (n: number) =>\n    new Intl.NumberFormat("en-IN", {\n      style: "currency",\n      currency: "INR",\n      maximumFractionDigits: 0,\n    }).format(n);`;
const newMoney = `  const displayRates: Record<string, number> = { INR: 1, USD: 0.012, GBP: 0.009, EUR: 0.010, AED: 0.044, CAD: 0.016, AUD: 0.018, SGD: 0.015, JPY: 1.75 };\n  const money = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: displayCurrency, maximumFractionDigits: displayCurrency === "INR" ? 0 : 2 }).format(n * (displayRates[displayCurrency] || 1));`;
replace(oldMoney,newMoney,`currency formatter`);
replace(`      <header>`,`      <div className="sg-currency-bar">\n        <label>Currency <select aria-label="Select display currency" value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>{["INR","USD","GBP","EUR","AED","CAD","AUD","SGD","JPY"].map((code) => <option key={code} value={code}>{code}</option>)}</select></label>\n        {displayCurrency !== "INR" && <small>Approximate display price · Orders remain priced in INR</small>}\n      </div>\n      <header>`,`currency selector UI`);

fs.writeFileSync(path, text);
const cssPath = "app/globals.css";
let css = fs.readFileSync(cssPath,"utf8");
if (!css.includes(".sg-currency-bar{")) {
  css += `\n.sg-currency-bar{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:6px 4%;font-size:12px;background:#fffaf5;border-bottom:1px solid #eee1d5}.sg-currency-bar label{display:flex;align-items:center;gap:6px}.sg-currency-bar select{padding:4px 7px;border:1px solid #d9cabe;border-radius:6px;background:#fff}.sg-currency-bar small{color:#755f58}@media(max-width:640px){.sg-currency-bar{justify-content:center;flex-wrap:wrap}.sg-currency-bar small{width:100%;text-align:center}}\n`;
  fs.writeFileSync(cssPath,css);
}
console.log("Shree Gauri international checkout and currency display applied.");
