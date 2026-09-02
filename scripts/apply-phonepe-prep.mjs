import fs from "node:fs";

const path = "app/storefront.tsx";
let text = fs.readFileSync(path, "utf8");

if (text.includes('setCheckoutMsg("Opening secure Razorpay payment...");')) {
  text = text.replace(
    'setCheckoutMsg("Opening secure Razorpay payment...");',
    'setCheckoutMsg("Opening secure payment...");',
  );
}

const needle = `      if (!response.ok) throw new Error(order.error);\n      if (!(window as any).Razorpay) {`;
const replacement = `      if (!response.ok) throw new Error(order.error);\n      if (order.provider === "phonepe" && order.redirect_url) {\n        setCheckoutMsg("Redirecting to secure PhonePe checkout...");\n        window.location.assign(order.redirect_url);\n        return;\n      }\n      if (!(window as any).Razorpay) {`;

if (!text.includes(replacement)) {
  if (!text.includes(needle)) {
    throw new Error("PhonePe storefront patch failed: checkout insertion point not found.");
  }
  text = text.replace(needle, replacement);
}

fs.writeFileSync(path, text);
console.log("Shree Gauri PhonePe preparation applied.");
