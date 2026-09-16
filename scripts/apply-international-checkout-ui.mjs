import fs from "node:fs";

const path = "app/storefront.tsx";
let text = fs.readFileSync(path, "utf8");
const replace = (from, to, label) => {
  if (text.includes(to)) return;
  if (!text.includes(from)) throw new Error(`International checkout patch failed: ${label}`);
  text = text.replace(from, to);
};

replace(
  `import { supabase } from "./lib/supabase";`,
  `import { supabase } from "./lib/supabase";\nimport { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountry, canUsePhonePe, INTERNATIONAL_PAYMENT_MESSAGE } from "./lib/global-commerce";`,
  "global commerce import"
);

replace(
`  pincode: string;\n};\ntype SavedAddress = {`,
`  pincode: string;\n  country_code: string;\n  phone_country_code: string;\n};\ntype SavedAddress = {`,
"checkout international fields"
);

replace(
`      pincode: "",\n    });`,
`      pincode: "",\n      country_code: DEFAULT_COUNTRY.code,\n      phone_country_code: DEFAULT_COUNTRY.dialCode,\n    });`,
"checkout defaults"
);

replace(
`      pincode: chosen?.pincode || "",\n    });`,
`      pincode: chosen?.pincode || "",\n      country_code: DEFAULT_COUNTRY.code,\n      phone_country_code: DEFAULT_COUNTRY.dialCode,\n    });`,
"saved address defaults"
);

replace(
`      pincode: a.pincode,\n    }));`,
`      pincode: a.pincode,\n      country_code: DEFAULT_COUNTRY.code,\n      phone_country_code: DEFAULT_COUNTRY.dialCode,\n    }));`,
"saved address selection"
);

replace(
`    setCheckoutBusy(true);`,
`    if (!canUsePhonePe(checkout.country_code)) {\n      setCheckoutMsg(INTERNATIONAL_PAYMENT_MESSAGE);\n      return;\n    }\n    setCheckoutBusy(true);`,
"international payment guard"
);

replace(
`            <div className="checkout-grid">`,
`            <div className="checkout-grid">\n              <label>Country\n                <select value={checkout.country_code} onChange={(e) => { const country = getCountry(e.target.value); setCheckout((c) => ({ ...c, country_code: country.code, phone_country_code: country.dialCode })); }}>\n                  {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}\n                </select>\n              </label>\n              <label>Phone code\n                <select value={checkout.phone_country_code} onChange={(e) => setCheckout((c) => ({ ...c, phone_country_code: e.target.value }))}>\n                  {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.dialCode}>{country.name} ({country.dialCode})</option>)}\n                </select>\n              </label>`,
"country and phone selectors"
);

replace(
`              Select a saved delivery address or enter another address, then complete payment securely through PhonePe.`,
`              Select a saved delivery address or enter another address. India orders can complete payment securely through PhonePe. International customers can enter their delivery details and contact Shree Gauri for shipping and payment assistance.`,
"international checkout copy"
);

fs.writeFileSync(path, text);
console.log("Shree Gauri international checkout UI applied.");
