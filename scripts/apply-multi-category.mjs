import fs from "node:fs";

function patch(path, needle, replacement, label) {
  let text = fs.readFileSync(path, "utf8");
  if (text.includes(replacement)) return;
  if (!text.includes(needle)) {
    throw new Error(`Multi-category patch failed (${label}) in ${path}.`);
  }
  text = text.replace(needle, replacement);
  fs.writeFileSync(path, text);
}

const admin = "app/admin/admin-dashboard.tsx";
const store = "app/storefront.tsx";

/* ADMIN: product type */
patch(
  admin,
  `  category_id: string | null;
  primary_image_url: string;`,
  `  category_id: string | null;
  category_ids: string[];
  primary_image_url: string;`,
  "admin product type",
);

/* ADMIN: blank product */
patch(
  admin,
  `  category_id: "",
  primary_image_url: "",`,
  `  category_id: "",
  category_ids: [] as string[],
  primary_image_url: "",`,
  "admin blank product",
);

/* ADMIN: normalize old + new products */
patch(
  admin,
  `          image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
        })),`,
  `          image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
          category_ids:
            Array.isArray(p.category_ids) && p.category_ids.length
              ? p.category_ids
              : p.category_id
                ? [p.category_id]
                : [],
        })),`,
  "admin load categories",
);

/* ADMIN: save both the new multi-category list and the old primary category */
patch(
  admin,
  `      category_id: prod.category_id || null,
      price_inr: Number(prod.price_inr),`,
  `      category_ids: Array.isArray(prod.category_ids) ? prod.category_ids : [],
      category_id:
        (Array.isArray(prod.category_ids) && prod.category_ids[0]) ||
        prod.category_id ||
        null,
      price_inr: Number(prod.price_inr),`,
  "admin save categories",
);

/* ADMIN: replace single dropdown with multi-select checkboxes */
patch(
  admin,
  `              <label>
                Category
                <select
                  value={prod.category_id || ""}
                  onChange={(e) =>
                    setProd({ ...prod, category_id: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>`,
  `              <div
                style={{
                  border: "1px solid #d8cbc0",
                  padding: "14px",
                  background: "#fff",
                }}
              >
                <b style={{ display: "block", marginBottom: "10px" }}>
                  Categories — select one or more
                </b>
                <small style={{ display: "block", marginBottom: "12px", color: "#806f68" }}>
                  The same product can appear in several categories, purposes or planets.
                </small>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "9px 12px",
                  }}
                >
                  {cats.map((c) => {
                    const selected = (prod.category_ids || []).includes(c.id);
                    const group =
                      c.collection_type === "purpose"
                        ? "Purpose"
                        : c.collection_type === "planet"
                          ? "Planet"
                          : c.parent_id
                            ? "Subcategory"
                            : "Category";
                    return (
                      <label
                        key={c.id}
                        className="check"
                        style={{
                          border: "1px solid #eadfd5",
                          padding: "9px",
                          borderRadius: "4px",
                          background: selected ? "#fff6df" : "#fff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = Array.isArray(prod.category_ids)
                              ? prod.category_ids
                              : [];
                            const category_ids = e.target.checked
                              ? Array.from(new Set([...current, c.id]))
                              : current.filter((id: string) => id !== c.id);
                            setProd({
                              ...prod,
                              category_ids,
                              category_id: category_ids[0] || "",
                            });
                          }}
                        />{" "}
                        <span>
                          {c.name}
                          <small
                            style={{
                              display: "block",
                              fontWeight: 400,
                              color: "#8a766e",
                              marginTop: "2px",
                            }}
                          >
                            {group}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>`,
  "admin category picker",
);

/* STOREFRONT: product type */
patch(
  store,
  `  category_id: string | null;
  name: string;`,
  `  category_id: string | null;
  category_ids: string[];
  name: string;`,
  "store product type",
);

/* STOREFRONT: request category_ids from Supabase */
patch(
  store,
  `"id,category_id,name,slug,short_description,description,price_inr,compare_at_price_inr,primary_image_url,image_urls,stock_quantity,is_featured,badge",`,
  `"id,category_id,category_ids,name,slug,short_description,description,price_inr,compare_at_price_inr,primary_image_url,image_urls,stock_quantity,is_featured,badge",`,
  "store select",
);

/* STOREFRONT: normalize memberships */
patch(
  store,
  `            image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
          })) as P[],`,
  `            image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            category_ids:
              Array.isArray(p.category_ids) && p.category_ids.length
                ? p.category_ids
                : p.category_id
                  ? [p.category_id]
                  : [],
          })) as P[],`,
  "store normalize categories",
);

/* STOREFRONT: category page filtering */
patch(
  store,
  `          activeCategory === p.category_id) &&`,
  `          activeCategory === p.category_id ||
          (!!activeCategory && p.category_ids.includes(activeCategory))) &&`,
  "store category page filter",
);

/* STOREFRONT: sidebar category filtering */
patch(
  store,
  `        (categoryFilter === "all" || p.category_id === categoryFilter) &&`,
  `        (categoryFilter === "all" ||
          p.category_id === categoryFilter ||
          p.category_ids.includes(categoryFilter)) &&`,
  "store sidebar category filter",
);

console.log("Shree Gauri multi-category support applied.");
