import fs from "node:fs";

const file = "app/storefront.tsx";
let text = fs.readFileSync(file, "utf8");

if (!text.includes('type CurrencyCode = "INR"')) {
  text = text.replace(
    `type Checkout = {\n  name: string;\n  email: string;\n  phone: string;\n  line1: string;\n  line2: string;\n  city: string;\n  state: string;\n  pincode: string;\n};`,
    `type Checkout = {\n  name: string;\n  email: string;\n  phone: string;\n  line1: string;\n  line2: string;\n  city: string;\n  state: string;\n  pincode: string;\n  country: string;\n};\ntype CurrencyCode = "INR" | "USD" | "GBP" | "EUR" | "AED" | "CAD" | "AUD" | "SGD";\nconst GLOBAL_CURRENCIES: { code: CurrencyCode; label: string }[] = [\n  { code: "INR", label: "India — INR" },\n  { code: "USD", label: "International — USD" },\n  { code: "GBP", label: "United Kingdom — GBP" },\n  { code: "EUR", label: "Europe — EUR" },\n  { code: "AED", label: "UAE — AED" },\n  { code: "CAD", label: "Canada — CAD" },\n  { code: "AUD", label: "Australia — AUD" },\n  { code: "SGD", label: "Singapore — SGD" },\n];\nconst DISPLAY_FX: Record<CurrencyCode, number> = { INR: 1, USD: 0.012, GBP: 0.009, EUR: 0.011, AED: 0.044, CAD: 0.016, AUD: 0.018, SGD: 0.016 };\nconst WORLD_COUNTRIES = ["India","United States","United Kingdom","United Arab Emirates","Canada","Australia","Singapore","France","Germany","Italy","Spain","Netherlands","Belgium","Switzerland","Austria","Ireland","Portugal","Sweden","Norway","Denmark","Finland","New Zealand","Japan","South Korea","Thailand","Malaysia","Indonesia","Philippines","Vietnam","Saudi Arabia","Qatar","Kuwait","Oman","Bahrain","South Africa","Mauritius","Nepal","Sri Lanka","Bangladesh"] as const;`
  );
}

text = text.replace(
  `      pincode: "",\n    });`,
  `      pincode: "",\n      country: "India",\n    });`
);

if (!text.includes('localStorage.getItem("sg_currency")')) {
  text = text.replace(
    `    [selectedAddressId, setSelectedAddressId] = useState("")`,
    `    [selectedAddressId, setSelectedAddressId] = useState(""),\n    [currency, setCurrency] = useState<CurrencyCode>(() => {\n      if (typeof window === "undefined") return "INR";\n      return (localStorage.getItem("sg_currency") as CurrencyCode) || "INR";\n    })`
  );
  text = text.replace(
    `  useEffect(() => {\n    Promise.all([`,
    `  useEffect(() => { localStorage.setItem("sg_currency", currency); }, [currency]);\n\n  useEffect(() => {\n    Promise.all([`
  );
}

if (!text.includes("formatGlobalPrice")) {
  text = text.replace(
    `export default function Storefront() {`,
    `function formatGlobalPrice(inr: number, currency: CurrencyCode) {\n  const amount = inr * DISPLAY_FX[currency];\n  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: currency === "INR" ? 0 : 2 }).format(amount);\n}\n\nexport default function Storefront() {`
  );
}

fs.writeFileSync(file, text);
console.log("Shree Gauri global foundation applied safely.");
