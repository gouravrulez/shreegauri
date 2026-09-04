"use client";

import { useEffect, useState } from "react";

export default function PaymentReturnPage() {
  const [message, setMessage] = useState("Confirming your payment securely...");
  const [done, setDone] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const storeOrderId = new URLSearchParams(window.location.search).get("store_order_id");
    if (!storeOrderId) {
      setMessage("We could not find this order reference. Please contact Shree Gauri support.");
      setDone(true);
      return;
    }

    let cancelled = false;
    async function check(attempt = 0) {
      try {
        const response = await fetch(
          `/api/payments/status?store_order_id=${encodeURIComponent(storeOrderId!)}`,
          { cache: "no-store" },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to confirm payment.");
        if (cancelled) return;

        setOrderNumber(result.order_number || "");
        if (result.status === "confirmed") {
          setSuccess(true);
          setDone(true);
          localStorage.removeItem("sg_cart");
          setMessage(`Order confirmed${result.order_number ? ` — ${result.order_number}` : ""}. Thank you for shopping with Shree Gauri.`);
          return;
        }
        if (result.status === "failed") {
          setDone(true);
          setMessage("The payment was not completed. Your order has not been marked as paid.");
          return;
        }

        if (attempt < 8) {
          setMessage("Payment received. Waiting for final confirmation...");
          window.setTimeout(() => check(attempt + 1), 2000);
        } else {
          setDone(true);
          setMessage("Your payment is still being confirmed. Please do not pay again. Your order will update automatically after PhonePe confirms it.");
        }
      } catch (error) {
        if (cancelled) return;
        setDone(true);
        setMessage(error instanceof Error ? error.message : "Unable to confirm payment. Please contact Shree Gauri support.");
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return (
    <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding:24, background:"#fffaf4" }}>
      <section style={{ width:"min(600px,100%)", background:"white", border:"1px solid #eadfd5", padding:32, boxShadow:"0 18px 60px rgba(50,10,15,.10)", textAlign:"center" }}>
        <div style={{ fontSize:46, marginBottom:12 }}>{success ? "✓" : done ? "!" : "…"}</div>
        <h1 style={{ color:"#3e0a0e", marginBottom:12 }}>{success ? "Order Confirmed" : "Shree Gauri Payment"}</h1>
        <p style={{ lineHeight:1.7, color:"#5f4d47" }}>{message}</p>
        {orderNumber && <p style={{ fontWeight:700 }}>Order: {orderNumber}</p>}
        {done && (
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginTop:18 }}>
            {success && <a href="/login?section=orders" style={{ padding:"12px 22px", background:"#3e0a0e", color:"white", textDecoration:"none", fontWeight:700 }}>VIEW MY ORDERS</a>}
            <a href="/" style={{ padding:"12px 22px", border:"1px solid #3e0a0e", color:"#3e0a0e", textDecoration:"none", fontWeight:700 }}>CONTINUE SHOPPING</a>
          </div>
        )}
      </section>
    </main>
  );
}
