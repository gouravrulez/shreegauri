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
          setMessage(
            `Payment successful${result.order_number ? `. Order ${result.order_number} is confirmed.` : "."}`,
          );
          return;
        }
        if (result.status === "failed") {
          setDone(true);
          setMessage("The payment was not completed. Your order has not been marked as paid.");
          return;
        }

        if (attempt < 5) {
          setMessage("Payment received. Waiting for final confirmation...");
          window.setTimeout(() => check(attempt + 1), 2000);
        } else {
          setDone(true);
          setMessage(
            "Your payment is still being confirmed. Please do not pay again. We will update the order after PhonePe confirms it.",
          );
        }
      } catch (error) {
        if (cancelled) return;
        setDone(true);
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm payment. Please contact Shree Gauri support.",
        );
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#fffaf4" }}>
      <section style={{ width: "min(560px, 100%)", background: "white", border: "1px solid #eadfd5", padding: 32, boxShadow: "0 18px 60px rgba(50,10,15,.10)", textAlign: "center" }}>
        <div style={{ fontSize: 46, marginBottom: 12 }}>{success ? "✓" : done ? "!" : "…"}</div>
        <h1 style={{ color: "#3e0a0e", marginBottom: 12 }}>Shree Gauri Payment</h1>
        <p style={{ lineHeight: 1.7, color: "#5f4d47" }}>{message}</p>
        {orderNumber && <p style={{ fontWeight: 700 }}>Order: {orderNumber}</p>}
        {done && (
          <a href="/" style={{ display: "inline-block", marginTop: 18, padding: "12px 22px", background: "#3e0a0e", color: "white", textDecoration: "none", fontWeight: 700 }}>
            RETURN TO SHREE GAURI
          </a>
        )}
      </section>
    </main>
  );
}
