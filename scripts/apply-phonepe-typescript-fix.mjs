import fs from "fs";

for (const path of [
  "app/api/payments/phonepe-webhook/route.ts",
  "app/api/payments/status/route.ts"
]) {
  if (!fs.existsSync(path)) continue;

  let s = fs.readFileSync(path, "utf8");

  s = s.replaceAll(
    '.find((x) => String(x?.state || "").toUpperCase() === "COMPLETED")',
    '.find((x: any) => String(x?.state || "").toUpperCase() === "COMPLETED")'
  );

  fs.writeFileSync(path, s);
}

console.log("PhonePe TypeScript fix applied");
