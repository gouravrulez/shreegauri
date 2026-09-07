import fs from "fs";
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
if(!p.scripts.prebuild.includes("apply-phonepe-typescript-fix.mjs")) p.scripts.prebuild += " && node scripts/apply-phonepe-typescript-fix.mjs";
fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\\n");