import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "app/storefront.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "app/cart-fix.tsx",
  "app/lib/supabase.ts",
  "app/shipping-returns/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
];
for (const rel of files) {
  const src = path.join(root, "vendor", "international", rel);
  const dest = path.join(root, rel);
  if (!fs.existsSync(src)) throw new Error(`Missing international template: ${rel}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}
console.log("Shree Gauri international storefront upgrade applied.");
