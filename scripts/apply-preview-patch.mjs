import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const patchDir = join(root, ".preview-patch");
if (!existsSync(patchDir)) throw new Error("Preview patch directory is missing.");
const chunks = readdirSync(patchDir).filter((name) => /^part\\d{4}$/.test(name)).sort();
if (chunks.length !== 85) throw new Error(`Expected 85 preview patch chunks, found ${chunks.length}.`);
const patchPath = join(root, ".preview-patch.diff");
writeFileSync(patchPath, Buffer.concat(chunks.map((name) => readFileSync(join(patchDir, name)))));
execFileSync("git", ["apply", "--check", patchPath], { cwd: root, stdio: "inherit" });
execFileSync("git", ["apply", "--whitespace=nowarn", patchPath], { cwd: root, stdio: "inherit" });
rmSync(patchPath, { force: true });
rmSync(patchDir, { recursive: true, force: true });
rmSync(join(root, "scripts", "apply-preview-patch.mjs"), { force: true });
rmSync(join(root, ".github", "workflows", "materialize-preview.yml"), { force: true });
console.log("Preview source patch applied and temporary files removed.");
