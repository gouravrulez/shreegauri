import fs from "node:fs";
function patch(path, needle, replacement, label) {
  let text=fs.readFileSync(path,"utf8");
  if(text.includes(replacement)) return;
  if(!text.includes(needle)) throw new Error(`Launch hardening patch failed (${label}) in ${path}`);
  fs.writeFileSync(path,text.replace(needle,replacement));
}
patch("app/layout.tsx",
`  title: "Shree Gauri | Divine Energy. Timeless Beauty.",
  description: "Authentic gemstones, sacred jewellery, Rudraksha, spiritual products and meaningful gifts.",`,
`  metadataBase: new URL("https://shreegauri.in"),
  title: { default: "Shree Gauri | Jewellery, Gemstones & Spiritual Products", template: "%s | Shree Gauri" },
  description: "Shop jewellery, gemstones, Rudraksha and thoughtfully selected spiritual products from Shree Gauri.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://shreegauri.in",
    siteName: "Shree Gauri",
    title: "Shree Gauri | Jewellery, Gemstones & Spiritual Products",
    description: "Jewellery, gemstones, Rudraksha and thoughtfully selected spiritual products.",
  },`,
"truthful metadata");

const admin="app/admin/admin-dashboard.tsx";
patch(admin,
`  order_status: string;
  created_at: string;`,
`  order_status: string;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  refund_status: string;
  created_at: string;`,
"order type");

patch(admin,
`  async function updateOrder(id: string, order_status: string) {`,
`  async function updateFulfilment(id: string, changes: Record<string, any>) {
    const { error } = await supabase.from("orders").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", id);
    setNotice(error?.message || "Order fulfilment updated.");
    load();
  }
  async function updateOrder(id: string, order_status: string) {`,
"fulfilment updater");

patch(admin,
`                  <div className="order-actions">
                    <a`,
`                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"8px",margin:"12px 0"}}>
                    <input placeholder="Courier name" defaultValue={o.courier_name || ""} onBlur={(e)=>updateFulfilment(o.id,{courier_name:e.target.value || null})} />
                    <input placeholder="Tracking / AWB number" defaultValue={o.tracking_number || ""} onBlur={(e)=>updateFulfilment(o.id,{tracking_number:e.target.value || null})} />
                    <input placeholder="Tracking URL" defaultValue={o.tracking_url || ""} onBlur={(e)=>updateFulfilment(o.id,{tracking_url:e.target.value || null})} />
                  </div>
                  <div className="order-actions">
                    <a`,
"tracking fields");

patch(admin,
`                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>`,
`                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>`,
"fulfilment statuses");
console.log("Shree Gauri launch hardening applied.");
