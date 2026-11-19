import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowed = new Set(["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled"]);

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] || character));

const statusCopy: Record<string, { title: string; message: string }> = {
  pending: { title: "Order update", message: "Your order is currently awaiting confirmation." },
  confirmed: { title: "Order confirmed", message: "Your order has been confirmed. Our team will prepare it with care." },
  processing: { title: "Order being prepared", message: "Your order is now being prepared by the Shree Gauri team." },
  packed: { title: "Your order is packed", message: "Your order has been carefully packed and is ready for dispatch." },
  shipped: { title: "Your order is dispatched", message: "Your order has been handed over to the delivery partner and is on its way." },
  delivered: { title: "Your order is delivered", message: "Your order has been marked as delivered. We hope you enjoy your Shree Gauri purchase." },
  cancelled: { title: "Order cancelled", message: "Your order has been cancelled. If you need help, please contact our support team." },
};

Deno.serve(async (req: Request) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Admin login required." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: "Admin session expired." }, 401);

    const db = createClient(url, service);
    const { data: staff } = await db.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
    if (!staff || !["admin", "manager", "orders"].includes(String(staff.role))) {
      return json({ error: "Not authorized for order management." }, 403);
    }

    const body = await req.json();
    const id = String(body?.order_id || "");
    const status = String(body?.order_status || "").toLowerCase();
    if (!id || !allowed.has(status)) return json({ error: "Invalid order update." }, 400);

    const { data: order, error: orderError } = await db.from("orders")
      .select("id,order_number,customer_name,email,order_status,total_inr,courier_name,tracking_number,tracking_url,dispatch_date,expected_delivery_date,order_items(product_name,quantity,unit_price_inr,line_total_inr)")
      .eq("id", id).single();
    if (orderError || !order) return json({ error: "Order not found." }, 404);

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { order_status: status, updated_at: now };
    if (status === "shipped") update.shipped_at = now;
    if (status === "delivered") update.delivered_at = now;
    if (status === "cancelled") update.cancelled_at = now;
    if (status === "shipped" && !order.dispatch_date) update.dispatch_date = now.slice(0, 10);

    const { error: updateError } = await db.from("orders").update(update).eq("id", id);
    if (updateError) throw updateError;

    if (order.order_status === status) return json({ ok: true, email_sent: false, warning: "This order already has that status; no duplicate email was sent." });
    if (!order.email) return json({ ok: true, email_sent: false, warning: "Order updated, but the customer email address is missing." });

    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ ok: true, email_sent: false, warning: "Order updated, but the email service is not configured." });

    const copy = statusCopy[status];
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #eee7df;color:#39262a;">${escapeHtml(item.product_name)}<div style="font-size:12px;color:#877a72;margin-top:3px;">Qty: ${Number(item.quantity || 0)}</div></td>
        <td align="right" style="padding:12px 14px;border-bottom:1px solid #eee7df;color:#39262a;white-space:nowrap;">₹${Number(item.line_total_inr || 0).toLocaleString("en-IN")}</td>
      </tr>`).join("");
    const trackingBlock = (order.courier_name || order.tracking_number || order.tracking_url) ? `
      <div style="margin:22px 0;padding:18px;background:#f8f3ec;border:1px solid #eadfce;border-radius:10px;">
        <div style="font-size:11px;letter-spacing:1.5px;color:#9a8057;font-weight:bold;margin-bottom:10px;">DELIVERY DETAILS</div>
        ${order.courier_name ? `<p style="margin:5px 0;">Courier: <strong>${escapeHtml(order.courier_name)}</strong></p>` : ""}
        ${order.tracking_number ? `<p style="margin:5px 0;">Article / Consignment No.: <strong>${escapeHtml(order.tracking_number)}</strong></p>` : ""}
        ${order.dispatch_date ? `<p style="margin:5px 0;">Dispatch date: <strong>${escapeHtml(order.dispatch_date)}</strong></p>` : ""}
        ${order.expected_delivery_date ? `<p style="margin:5px 0;">Estimated delivery: <strong>${escapeHtml(order.expected_delivery_date)}</strong></p>` : ""}
        ${order.tracking_url ? `<p style="margin:14px 0 0;"><a href="${escapeHtml(order.tracking_url)}" style="display:inline-block;background:#4a111a;color:#fff;text-decoration:none;padding:11px 18px;border-radius:6px;font-weight:bold;">TRACK YOUR ORDER</a></p>` : ""}
      </div>` : "";

    const from = Deno.env.get("ORDER_EMAIL_FROM") || "Shree Gauri <orders@shreegauri.in>";
    const html = `
      <div style="background:#f6f2ec;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#39262a;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e8dfd4;border-radius:14px;overflow:hidden;">
          <div style="padding:25px 28px;background:#4a111a;color:#fff;">
            <div style="font-family:Georgia,serif;font-size:23px;letter-spacing:2px;">SHREE GAURI</div>
            <div style="font-size:10px;letter-spacing:2px;margin-top:5px;color:#e9d9c3;">A THOUGHTFUL EXPERIENCE, EVERY STEP</div>
          </div>
          <div style="padding:28px;">
            <div style="font-size:11px;letter-spacing:1.7px;color:#9a8057;font-weight:bold;">ORDER UPDATE</div>
            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#4a111a;margin:10px 0 16px;">${copy.title}</h1>
            <p style="font-size:14px;line-height:1.7;">Namaste ${escapeHtml(order.customer_name || "Customer")},</p>
            <p style="font-size:14px;line-height:1.7;">${copy.message}</p>
            <div style="margin:22px 0;padding:15px 17px;background:#fbf8f4;border-radius:8px;">
              <div style="font-size:10px;color:#8a776a;letter-spacing:1.2px;">ORDER NUMBER</div>
              <div style="font-size:18px;font-weight:bold;color:#4a111a;margin-top:5px;">${escapeHtml(order.order_number)}</div>
            </div>
            <div style="font-size:11px;letter-spacing:1.4px;color:#9a8057;font-weight:bold;margin-bottom:8px;">ORDER SUMMARY</div>
            <table role="presentation" style="width:100%;border-collapse:collapse;">${itemRows || "<tr><td style='padding:12px;'>Your order details are available in your account.</td></tr>"}</table>
            <div style="display:flex;justify-content:space-between;padding:15px 14px;border-top:1px solid #e8dfd4;font-size:15px;"><strong>Order total</strong><strong>₹${Number(order.total_inr || 0).toLocaleString("en-IN")}</strong></div>
            ${trackingBlock}
            <p style="font-size:13px;line-height:1.7;color:#6e605a;">Thank you for choosing Shree Gauri. We appreciate your trust and look forward to serving you again.</p>
            <p style="font-size:13px;color:#6e605a;margin-bottom:0;">Warm regards,<br><strong>Team Shree Gauri</strong></p>
          </div>
          <div style="padding:16px 28px;background:#fbf8f4;border-top:1px solid #eee7df;font-size:11px;color:#8a7d74;">For assistance, reply to this email or contact gauritechnologiespvt@gmail.com.</div>
        </div>
      </div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [order.email], subject: `${copy.title} — ${order.order_number}`, html }),
    });
    if (!response.ok) {
      console.error("Resend:", await response.text());
      return json({ ok: true, email_sent: false, warning: "Order updated, but the customer email could not be sent." });
    }
    return json({ ok: true, email_sent: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Unable to update order status." }, 500);
  }
});
