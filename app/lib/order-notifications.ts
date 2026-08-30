import type { SupabaseClient } from "@supabase/supabase-js";

type OrderRecord = {
  id: string;
  order_number: string;
  customer_name?: string | null;
  email?: string | null;
  phone?: string | null;
  shipping_address?: Record<string, unknown> | null;
  subtotal_inr?: number | null;
  shipping_inr?: number | null;
  discount_inr?: number | null;
  total_inr?: number | null;
  payment_status?: string | null;
  order_status?: string | null;
  payment_reference?: string | null;
};

type OrderItem = {
  product_name?: string | null;
  variant_label?: string | null;
  quantity?: number | null;
  unit_price_inr?: number | null;
  line_total_inr?: number | null;
};

const ADMIN_EMAIL =
  process.env.ORDER_NOTIFICATION_EMAIL || "gauritechnologiespvt@gmail.com";

const ADMIN_WHATSAPP = (
  process.env.WHATSAPP_ADMIN_PHONE || "917400617601"
).replace(/\D/g, "");

function money(value: unknown) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

function addressText(address: Record<string, unknown> | null | undefined) {
  if (!address) return "Not provided";

  const preferred = [
    "address",
    "address_line1",
    "address_line2",
    "city",
    "state",
    "pincode",
    "pin",
    "postal_code",
  ];

  const parts = preferred
    .map((key) => address[key])
    .filter((v) => v !== undefined && v !== null && String(v).trim())
    .map((v) => String(v).trim());

  if (parts.length) return parts.join(", ");

  return (
    Object.values(address)
      .filter((v) => v !== undefined && v !== null && String(v).trim())
      .map((v) => String(v).trim())
      .join(", ") || "Not provided"
  );
}

function itemLines(items: OrderItem[]) {
  if (!items.length) return "Order items unavailable";

  return items
    .map((item) => {
      const variant = item.variant_label ? ` (${item.variant_label})` : "";
      const qty = Number(item.quantity || 1);
      const total =
        item.line_total_inr ?? Number(item.unit_price_inr || 0) * qty;

      return `${item.product_name || "Product"}${variant} × ${qty} — ${money(
        total
      )}`;
    })
    .join("\n");
}

async function sendEmail(order: OrderRecord, items: OrderItem[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;

  if (!apiKey || !from) {
    return { skipped: true, reason: "Email provider not configured" };
  }

  const subject = `New paid order ${order.order_number} — ${money(
    order.total_inr
  )}`;

  const text = [
    "NEW PAID ORDER — SHREE GAURI",
    "",
    `Order: ${order.order_number}`,
    `Amount: ${money(order.total_inr)}`,
    `Payment: ${order.payment_status || "paid"}`,
    `Payment ID: ${order.payment_reference || "-"}`,
    "",
    `Customer: ${order.customer_name || "-"}`,
    `Phone: ${order.phone || "-"}`,
    `Email: ${order.email || "-"}`,
    `Address: ${addressText(order.shipping_address)}`,
    "",
    "Items:",
    itemLines(items),
    "",
    `Subtotal: ${money(order.subtotal_inr)}`,
    `Discount: ${money(order.discount_inr)}`,
    `Shipping: ${money(order.shipping_inr)}`,
    `Total: ${money(order.total_inr)}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [ADMIN_EMAIL],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Email notification failed: ${response.status} ${await response.text()}`
    );
  }

  return { sent: true };
}

async function sendWhatsApp(order: OrderRecord) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_ORDER_TEMPLATE || "new_order_admin";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

  if (!token || !phoneNumberId) {
    return { skipped: true, reason: "WhatsApp provider not configured" };
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: ADMIN_WHATSAPP,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(order.order_number) },
                {
                  type: "text",
                  text: String(order.customer_name || "Customer"),
                },
                { type: "text", text: String(order.phone || "-") },
                { type: "text", text: money(order.total_inr) },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `WhatsApp notification failed: ${response.status} ${await response.text()}`
    );
  }

  return { sent: true };
}

export async function notifyPaidOrder(
  admin: SupabaseClient,
  orderId: string
) {
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(
      orderError?.message || "Paid order not found for notification"
    );
  }

  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);

  const results = await Promise.allSettled([
    sendEmail(order as OrderRecord, (items || []) as OrderItem[]),
    sendWhatsApp(order as OrderRecord),
  ]);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.warn(
        index === 0
          ? "Order email notification error:"
          : "Order WhatsApp notification error:",
        result.reason
      );
    }
  });
}
