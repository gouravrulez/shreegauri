import fs from "node:fs";

function patch(path, needle, replacement, label) {
  let text = fs.readFileSync(path, "utf8");
  if (text.includes(replacement)) return;
  if (!text.includes(needle)) {
    throw new Error(`Premium product manager patch failed (${label}) in ${path}.`);
  }
  text = text.replace(needle, replacement);
  fs.writeFileSync(path, text);
}

const admin = "app/admin/admin-dashboard.tsx";

patch(
  admin,
  `  category_ids: string[];
  primary_image_url: string;`,
  `  category_ids: string[];
  sku: string | null;
  product_type: string | null;
  material: string | null;
  gemstone_name: string | null;
  natural_lab_status: string | null;
  origin: string | null;
  treatment: string | null;
  certification: string | null;
  shape: string | null;
  color: string | null;
  weight_grams: number | null;
  carat_weight: number | null;
  chakras: string[];
  zodiac_signs: string[];
  seo_title: string | null;
  seo_description: string | null;
  primary_image_url: string;`,
  "product type",
);

patch(
  admin,
  `  category_ids: [] as string[],
  primary_image_url: "",`,
  `  category_ids: [] as string[],
  sku: "",
  product_type: "",
  material: "",
  gemstone_name: "",
  natural_lab_status: "",
  origin: "",
  treatment: "",
  certification: "",
  shape: "",
  color: "",
  weight_grams: "",
  carat_weight: "",
  chakras: [] as string[],
  zodiac_signs: [] as string[],
  seo_title: "",
  seo_description: "",
  primary_image_url: "",`,
  "blank product fields",
);

patch(
  admin,
  `export default function AdminDashboard() {`,
  `const chakraOptions = ["Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown"];
const zodiacOptions = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

export default function AdminDashboard() {`,
  "option constants",
);

patch(
  admin,
  `      price_inr: Number(prod.price_inr),`,
  `      sku: prod.sku?.trim() || null,
      weight_grams: prod.weight_grams ? Number(prod.weight_grams) : null,
      carat_weight: prod.carat_weight ? Number(prod.carat_weight) : null,
      chakras: Array.isArray(prod.chakras) ? prod.chakras : [],
      zodiac_signs: Array.isArray(prod.zodiac_signs) ? prod.zodiac_signs : [],
      seo_title: prod.seo_title?.trim() || null,
      seo_description: prod.seo_description?.trim() || null,
      price_inr: Number(prod.price_inr),`,
  "save premium fields",
);

patch(
  admin,
  `              <label>
                Main Product Photo`,
  `              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "12px" }}>Product Details & Inventory</h3>
                <div className="two">
                  <label>
                    SKU
                    <input value={prod.sku || ""} placeholder="Auto-generated if left blank"
                      onChange={(e) => setProd({ ...prod, sku: e.target.value })} />
                  </label>
                  <label>
                    Product Type
                    <input value={prod.product_type || ""} placeholder="Gemstone, Ring, Bracelet..."
                      onChange={(e) => setProd({ ...prod, product_type: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Material
                    <input value={prod.material || ""} placeholder="Silver, Gold, Brass..."
                      onChange={(e) => setProd({ ...prod, material: e.target.value })} />
                  </label>
                  <label>
                    Gemstone
                    <input value={prod.gemstone_name || ""} placeholder="Emerald, Citrine..."
                      onChange={(e) => setProd({ ...prod, gemstone_name: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Stone Weight (Carat)
                    <input type="number" step="0.001" value={prod.carat_weight || ""}
                      onChange={(e) => setProd({ ...prod, carat_weight: e.target.value })} />
                  </label>
                  <label>
                    Weight (grams)
                    <input type="number" step="0.001" value={prod.weight_grams || ""}
                      onChange={(e) => setProd({ ...prod, weight_grams: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Shape
                    <input value={prod.shape || ""}
                      onChange={(e) => setProd({ ...prod, shape: e.target.value })} />
                  </label>
                  <label>
                    Colour
                    <input value={prod.color || ""}
                      onChange={(e) => setProd({ ...prod, color: e.target.value })} />
                  </label>
                </div>
                <div className="two">
                  <label>
                    Natural / Lab Status
                    <select value={prod.natural_lab_status || ""}
                      onChange={(e) => setProd({ ...prod, natural_lab_status: e.target.value })}>
                      <option value="">Not specified</option>
                      <option value="Natural">Natural</option>
                      <option value="Lab Created">Lab Created</option>
                    </select>
                  </label>
                  <label>
                    Certification
                    <select value={prod.certification || ""}
                      onChange={(e) => setProd({ ...prod, certification: e.target.value })}>
                      <option value="">Not specified</option>
                      <option value="Certificate Available">Yes — Certificate Available</option>
                      <option value="No Certificate">No Certificate</option>
                    </select>
                  </label>
                </div>
                <div className="two">
                  <label>
                    Origin
                    <input value={prod.origin || ""} placeholder="Only enter if verified"
                      onChange={(e) => setProd({ ...prod, origin: e.target.value })} />
                  </label>
                  <label>
                    Treatment
                    <input value={prod.treatment || ""} placeholder="Only enter if known"
                      onChange={(e) => setProd({ ...prod, treatment: e.target.value })} />
                  </label>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "6px" }}>Chakra</h3>
                <small style={{ display: "block", marginBottom: "10px", color: "#806f68" }}>
                  Select only associations you want to use for this product.
                </small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
                  {chakraOptions.map((name) => (
                    <label className="check" key={name}>
                      <input type="checkbox" checked={(prod.chakras || []).includes(name)}
                        onChange={(e) => {
                          const current = prod.chakras || [];
                          setProd({ ...prod, chakras: e.target.checked
                            ? Array.from(new Set([...current, name]))
                            : current.filter((x: string) => x !== name) });
                        }} />{" "}{name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "6px" }}>Zodiac</h3>
                <small style={{ display: "block", marginBottom: "10px", color: "#806f68" }}>
                  You may select more than one zodiac sign.
                </small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
                  {zodiacOptions.map((name) => (
                    <label className="check" key={name}>
                      <input type="checkbox" checked={(prod.zodiac_signs || []).includes(name)}
                        onChange={(e) => {
                          const current = prod.zodiac_signs || [];
                          setProd({ ...prod, zodiac_signs: e.target.checked
                            ? Array.from(new Set([...current, name]))
                            : current.filter((x: string) => x !== name) });
                        }} />{" "}{name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e7d9ce", paddingTop: "18px", marginTop: "8px" }}>
                <h3 style={{ marginBottom: "12px" }}>Google / SEO</h3>
                <label>
                  SEO Title
                  <input value={prod.seo_title || ""} maxLength={70}
                    placeholder={prod.name ? prod.name + " | Shree Gauri" : "Product title for Google"}
                    onChange={(e) => setProd({ ...prod, seo_title: e.target.value })} />
                </label>
                <label>
                  SEO Description
                  <textarea value={prod.seo_description || ""} maxLength={170}
                    placeholder="Short accurate description for search engines"
                    onChange={(e) => setProd({ ...prod, seo_description: e.target.value })} />
                </label>
              </div>

              <label>
                Main Product Photo`,
  "premium product form",
);

console.log("Shree Gauri premium product manager applied.");
