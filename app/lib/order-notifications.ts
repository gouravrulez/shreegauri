import type { SupabaseClient } from "@supabase/supabase-js";

type Order = {
  id: string; order_number: string; customer_name?: string | null;
  email?: string | null; phone?: string | null;
  shipping_address?: Record<string, unknown> | null;
  subtotal_inr?: number | null; shipping_inr?: number | null;
  discount_inr?: number | null; total_inr?: number | null;
  payment_status?: string | null; payment_reference?: string | null;
};
type Item = {
  product_name?: string | null; variant_label?: string | null;
  quantity?: number | null; unit_price_inr?: number | null;
  line_total_inr?: number | null;
};

const ADMIN_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || "gauritechnologiespvt@gmail.com";
const ADMIN_WHATSAPP = (process.env.WHATSAPP_ADMIN_PHONE || "917400617601").replace(/\D/g, "");

const money = (v: unknown) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

function addressText(a?: Record<string, unknown> | null) {
  if (!a) return "Not provided";
  const keys = ["address","address_line1","address_line2","city","state","pincode","pin","postal_code"];
  const parts = keys.map(k => a[k]).filter(v => v != null && String(v).trim()).map(v => String(v).trim());
  return parts.length ? parts.join(", ") : Object.values(a).filter(v => v != null && String(v).trim()).join(", ") || "Not provided";
}

function itemLines(items: Item[]) {
  return items.length ? items.map(i => {
    const qty = Number(i.quantity || 1);
    const variant = i.variant_label ? ` (${i.variant_label})` : "";
    const total = i.line_total_inr ?? Number(i.unit_price_inr || 0) * qty;
    return `${i.product_name || "Product"}${variant} × ${qty} — ${money(total)}`;
  }).join("\n") : "Order items unavailable";
}

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!key || !from) return { skipped: true };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text })
  });
  if (!r.ok) throw new Error(`Email failed: ${r.status} ${await r.text()}`);
  return { sent: true };
}

async function adminEmail(o: Order, items: Item[]) {
  return sendEmail(ADMIN_EMAIL, `New paid order ${o.order_number} — ${money(o.total_inr)}`, [
    "NEW PAID ORDER — SHREE GAURI","",
    `Order: ${o.order_number}`, `Amount: ${money(o.total_inr)}`,
    `Payment: ${o.payment_status || "paid"}`, `Payment ID: ${o.payment_reference || "-"}`,"",
    `Customer: ${o.customer_name || "-"}`, `Phone: ${o.phone || "-"}`,
    `Email: ${o.email || "-"}`, `Address: ${addressText(o.shipping_address)}`,"",
    "Items:", itemLines(items),"", `Total: ${money(o.total_inr)}`
  ].join("\n"));
}

async function customerEmail(o: Order, items: Item[]) {
  if (!o.email) return { skipped: true };
  return sendEmail(o.email, `Order Confirmed — ${o.order_number} | Shree Gauri`, [
    `Dear ${o.customer_name || "Customer"},`,"",
    "Thank you for shopping with Shree Gauri.",
    "Your payment has been received successfully and your order is confirmed.","",
    `Order Number: ${o.order_number}`, "Payment Status: Paid",
    `Order Total: ${money(o.total_inr)}`,"",
    "ORDER DETAILS", itemLines(items),"",
    `Delivery Address: ${addressText(o.shipping_address)}`,"",
    "We will keep you informed as your order is processed.",
    "For assistance, please contact Shree Gauri customer support.","",
    "Warm regards,", "Shree Gauri"
  ].join("\n"));
}

async function adminWhatsApp(o: Order) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { skipped: true };
  const r = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to: ADMIN_WHATSAPP, type: "template",
      template: {
        name: process.env.WHATSAPP_ORDER_TEMPLATE || "new_order_admin",
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
        components: [{ type: "body", parameters: [
          { type: "text", text: String(o.order_number) },
          { type: "text", text: String(o.customer_name || "Customer") },
          { type: "text", text: String(o.phone || "-") },
          { type: "text", text: money(o.total_inr) }
        ]}]
      }
    })
  });
  if (!r.ok) throw new Error(`WhatsApp failed: ${r.status} ${await r.text()}`);
  return { sent: true };
}

export async function notifyPaidOrder(admin: SupabaseClient, orderId: string) {
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) throw new Error(error?.message || "Paid order not found");
  const { data: items, error: itemError } = await admin.from("order_items").select("*").eq("order_id", orderId);
  if (itemError) throw new Error(itemError.message);

  const results = await Promise.allSettled([
    adminEmail(order as Order, (items || []) as Item[]),
    customerEmail(order as Order, (items || []) as Item[]),
    adminWhatsApp(order as Order)
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(["Admin email","Customer email","WhatsApp"][i] + " error:", r.reason);
  });
}
