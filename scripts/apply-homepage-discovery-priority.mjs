import fs from "node:fs";

const file = "app/storefront.tsx";
let source = fs.readFileSync(file, "utf8");

// Match the live-site sequence: hero, featured products, then the three
// discovery sections. Keep the sections and their existing content intact.
const discoveryStartMarker = '      {(view === "home" || view === "shop") && (';
const catalogStartMarker = '      {(view === "home" ||\n        view === "shop" ||';
const founderMarker = '      {(view === "home" || view === "about" || view === "contact") && (';

const discoveryStart = source.indexOf(discoveryStartMarker);
const catalogStart = source.indexOf(catalogStartMarker);
if (discoveryStart < 0 || catalogStart < 0 || discoveryStart > catalogStart) {
  console.log("Homepage discovery sections are already after the product catalog; no move needed.");
  process.exit(0);
}

const discoveryBlock = source.slice(discoveryStart, catalogStart);
source = source.slice(0, discoveryStart) + source.slice(catalogStart);

const founderStart = source.indexOf(founderMarker);
if (founderStart < 0) {
  throw new Error("Could not locate the homepage content after the product catalog.");
}

source = source.slice(0, founderStart) + discoveryBlock + source.slice(founderStart);

// Guard against accidental duplicate sections or a misplaced product catalog.
const categoryIndex = source.indexOf("<h2>Shop by Category</h2>");
const purposeIndex = source.indexOf("<h2>Shop by Purpose</h2>");
const planetIndex = source.indexOf("<h2>Shop by Planet</h2>");
const productIndex = source.indexOf('className="section cream catalog"');
if (
  categoryIndex < 0 ||
  purposeIndex < 0 ||
  planetIndex < 0 ||
  productIndex < 0 ||
  !(productIndex < categoryIndex && categoryIndex < purposeIndex && purposeIndex < planetIndex)
) {
  throw new Error("Homepage order validation failed; expected products, category, purpose, planet.");
}

fs.writeFileSync(file, source);
console.log("Homepage order restored: featured products, Shop by Category, Shop by Purpose, Shop by Planet.");
