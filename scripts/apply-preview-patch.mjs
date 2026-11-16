import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const patchDir = ".preview-patch";
const chunks = readdirSync(patchDir).filter((name) => /^chunk-\d{4}$/.test(name)).sort();
if (chunks.length !== 55) {
  throw new Error(`Preview patch is incomplete: expected 55 chunks, found ${chunks.length}.`);
}
const encoded = chunks.map((name) => readFileSync(join(patchDir, name), "utf8")).join("");
const archive = "/tmp/shreegauri-preview-patch.tar.gz";
writeFileSync(archive, Buffer.from(encoded, "base64"));
execFileSync("tar", ["-xzf", archive, "-C", process.cwd()]);
rmSync(archive);
console.log("Applied the complete Shree Gauri preview source bundle.");
