import fs from "node:fs";

function requireReplace(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) throw new Error("Store refresh patch failed: " + label);
  return source.replace(needle, replacement);
}

// Storefront: predictable pagination, with 20 products per page and scroll-to-catalog navigation.
const storePath = "app/storefront.tsx";
let store = fs.readFileSync(storePath, "utf8");
store = requireReplace(
  store,
  '    [filtersOpen, setFiltersOpen] = useState(false),',
  '    [filtersOpen, setFiltersOpen] = useState(false),\n    [currentPage, setCurrentPage] = useState(1),',
  "pagination state"
);
store = requireReplace(
  store,
  '  const nav = [',
  `  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const pageProducts = shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setCurrentPage(1); }, [q, view, categoryFilter, stockOnly, maxPrice, sort]);
  useEffect(() => { if (currentPage > pageCount) setCurrentPage(pageCount); }, [currentPage, pageCount]);
  const changeCatalogPage = (next: number) => {
    setCurrentPage(Math.min(pageCount, Math.max(1, next)));
    requestAnimationFrame(() => document.querySelector(".catalog")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const nav = [`,
  "pagination calculations"
);
store = requireReplace(store, "                shown.map((p) => (", "                pageProducts.map((p) => (", "paginated product list");
const paginationAnchor = `            </div>
          </div>
        </section>
      )}
      {view === "about" && (`;
const paginationMarkup = `            </div>
          </div>
          {shown.length > pageSize && (
            <nav className="catalog-pagination" aria-label="Product pages">
              <button type="button" onClick={() => changeCatalogPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
              <div className="catalog-page-numbers">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                  <button type="button" key={page} className={page === currentPage ? "active" : ""} aria-current={page === currentPage ? "page" : undefined} onClick={() => changeCatalogPage(page)}>{page}</button>
                ))}
              </div>
              <span>Page {currentPage} of {pageCount}</span>
              <button type="button" onClick={() => changeCatalogPage(currentPage + 1)} disabled={currentPage === pageCount}>Next</button>
            </nav>
          )}
        </section>
      )}
      {view === "about" && (`;
store = requireReplace(store, paginationAnchor, paginationMarkup, "pagination controls");
fs.writeFileSync(storePath, store);

// Admin: ensure the nine planetary collections can be added once, then associated to products.
// Multi-category support persists all selections in category_ids, retaining the legacy primary category_id.
const adminPath = "app/admin/admin-dashboard.tsx";
let admin = fs.readFileSync(adminPath, "utf8");
const helperAnchor = "  async function saveCat() {";
const helper = `  async function ensurePlanetCategories() {
    const planets = [
      ["Sun", "sun", "☉"], ["Moon", "moon", "☾"], ["Mars", "mars", "♂"],
      ["Mercury", "mercury", "☿"], ["Jupiter", "jupiter", "♃"],
      ["Venus", "venus", "♀"], ["Saturn", "saturn", "♄"],
      ["Rahu", "rahu", "☊"], ["Ketu", "ketu", "☋"],
    ];
    const existing = new Set(cats.filter((c) => c.collection_type === "planet").map((c) => c.name.toLowerCase()));
    const missing = planets.filter(([name]) => !existing.has(name.toLowerCase()));
    if (!missing.length) { setNotice("All nine planet associations are already available."); return; }
    const rows = missing.map(([name, slug], index) => ({
      name, slug, description: `Products traditionally associated with ${name}.`,
      image_url: "", parent_id: null, collection_type: "planet", is_active: true,
      sort_order: 100 + index,
    }));
    const { error } = await supabase.from("categories").insert(rows);
    if (error) { setNotice(`Planet collections could not be added: ${error.message}`); return; }
    setNotice("Planet associations added. You can now select Sun, Moon and the other planets for products.");
    await load();
  }
`;
if (!admin.includes("async function ensurePlanetCategories()")) {
  if (!admin.includes(helperAnchor)) throw new Error("Store refresh patch failed: admin planet helper anchor");
  admin = admin.replace(helperAnchor, helper + helperAnchor);
}
admin = admin.replace("Categories — select one or more", "Product placement — choose categories, purposes and planets");
admin = admin.replace(
  "The same product can appear in several categories, purposes or planets.\n                  </small>",
  `The same product can appear in several collections. Select every relevant option below.
                  </small>
                  <button type="button" className="quick-planet-setup" onClick={ensurePlanetCategories}>＋ Add missing Navagraha (Sun to Ketu)</button>`
);

// Remove the unused Chakra and Zodiac selection panels from the product editor, without deleting stored data.
const chakraTitle = admin.indexOf(">Chakra</h3>");
const seoTitle = admin.indexOf(">Google / SEO</h3>");
if (chakraTitle >= 0 && seoTitle > chakraTitle) {
  const start = admin.lastIndexOf('<div style={{ borderTop:', chakraTitle);
  const seoStart = admin.lastIndexOf('<div style={{ borderTop:', seoTitle);
  if (start >= 0 && seoStart > start) admin = admin.slice(0, start) + admin.slice(seoStart);
}
fs.writeFileSync(adminPath, admin);

// Polished, responsive retail grid and compact pagination/admin controls.
const cssPath = "app/globals.css";
let css = fs.readFileSync(cssPath, "utf8");
const cssMarker = "/* Shree Gauri professional retail catalogue refresh */";
if (!css.includes(cssMarker)) {
  css += `

${cssMarker}
.product-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;max-width:1500px;margin:26px auto 12px}
.product-grid article{min-width:0;border:1px solid #e9e0d7;border-radius:10px;overflow:hidden;box-shadow:0 3px 14px rgba(58,26,17,.045);transition:transform .18s ease,box-shadow .18s ease}
.product-grid article:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(58,26,17,.10)}
.product-grid .photo{height:auto;aspect-ratio:1/1;background:#fff}
.product-grid .info{padding:13px 14px 15px}
.product-grid .info h3{font:600 16px/1.35 Georgia,serif;min-height:42px;margin:6px 0}
.product-grid .info p{font-size:12px;line-height:1.45;min-height:35px;max-height:35px;overflow:hidden;margin:5px 0 9px}
.product-grid .info>b{font-size:17px;color:#421016}
.product-grid .info del{font-size:12px}
.product-grid .info>small{font-size:9px;letter-spacing:1.3px}
.product-grid .info .product-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}
.product-grid .info .product-actions button{min-width:0;padding:10px 5px;border-radius:5px;font-size:10px;letter-spacing:.2px}
.catalog-pagination{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;margin:30px auto 8px;padding:15px 12px;max-width:100%;border-top:1px solid #e9ded3}
.catalog-pagination button{min-width:38px;height:38px;padding:0 12px;border:1px solid #dfd1c4;border-radius:6px;background:#fff;color:#4c1718;font-size:12px;font-weight:700;cursor:pointer}
.catalog-pagination button.active{background:#4a1016;border-color:#4a1016;color:#fff}
.catalog-pagination button:disabled{opacity:.38;cursor:not-allowed}
.catalog-page-numbers{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.catalog-pagination>span{font-size:11px;color:#786a62;padding:0 5px}
.quick-planet-setup{align-self:flex-start;border:1px solid #d9c8ad;background:#fffaf2;color:#6e451d;padding:9px 12px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer}
.editor{border-radius:12px;box-shadow:0 8px 26px rgba(75,28,40,.055)}
.editor>label{font-size:12px;font-weight:750;color:#57423b;gap:7px}
.editor input:not([type=checkbox]),.editor select,.editor textarea{border:1px solid #ded3c8;border-radius:7px;padding:11px 12px;background:#fff;min-height:43px}
.editor input:focus,.editor select:focus,.editor textarea:focus{outline:2px solid #d8bd8d;outline-offset:1px}
.editor h3{font:600 17px Georgia,serif;color:#4b1115}
.editor .check{padding:9px 10px;border:1px solid #eee4da;border-radius:6px;background:#fffaf6}
@media(min-width:1500px){.product-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:20px}}
@media(max-width:1100px){.product-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}}
@media(max-width:700px){.product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.product-grid .info{padding:10px}.product-grid .info h3{font-size:14px;min-height:38px}.product-grid .info p{font-size:11px;min-height:32px;max-height:32px}.product-grid .info .product-actions{gap:5px}.product-grid .info .product-actions button{font-size:9px;padding:9px 3px}.catalog-pagination{gap:6px;margin-top:20px}.catalog-pagination button{min-width:34px;height:35px;padding:0 9px}}
@media(max-width:360px){.product-grid{grid-template-columns:1fr}}
`;
}
fs.writeFileSync(cssPath, css);
console.log("Shree Gauri storefront pagination, responsive 4–5 column catalogue, and product association editor applied.");
