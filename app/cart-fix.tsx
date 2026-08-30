"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingBag, X } from "lucide-react";

type AddedItem = {
  name: string;
  price: string;
  image: string;
};

export default function CartFix() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [added, setAdded] = useState<AddedItem | null>(null);

  useEffect(() => {
    const textOf = (el: Element | null) =>
      (el?.textContent || "").trim().toUpperCase();

    const detailsFrom = (target: Element): AddedItem => {
      const modal = target.closest(".product-detail");
      const card = target.closest("article");
      const scope = modal || card || target.parentElement;
      const name =
        scope?.querySelector("h2")?.textContent?.trim() ||
        scope?.querySelector("h3")?.textContent?.trim() ||
        "Item";
      const priceNode =
        scope?.querySelector(".product-copy h3") ||
        scope?.querySelector(".info > b");
      const price = priceNode?.textContent?.trim() || "";
      const image =
        (scope?.querySelector("img") as HTMLImageElement | null)?.src || "";
      return { name, price, image };
    };

    const showAdded = (item: AddedItem) => {
      setAdded(item);
      setToast(true);
      setOpen(true);
      window.setTimeout(() => setToast(false), 2600);
    };

    const clickCartAndCheckout = () => {
      const headerButtons = Array.from(
        document.querySelectorAll("header .head-actions button"),
      ) as HTMLButtonElement[];

      const cartButton = headerButtons.find((b) =>
        textOf(b).includes("CART"),
      );
      cartButton?.click();

      window.setTimeout(() => {
        const buttons = Array.from(
          document.querySelectorAll("button"),
        ) as HTMLButtonElement[];
        const placeOrder = buttons.find(
          (b) => textOf(b) === "PLACE ORDER",
        );
        placeOrder?.click();
      }, 150);
    };

    const handler = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const action = target?.closest("button, a");
      if (!action) return;

      const label = textOf(action);

      if (label === "BUY NOW") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const item = detailsFrom(action);
        const scope =
          action.closest(".product-detail") || action.closest("article");

        const addButton = Array.from(
          scope?.querySelectorAll("button") || [],
        ).find((b) => textOf(b) === "ADD TO CART") as
          | HTMLButtonElement
          | undefined;

        if (addButton) {
          addButton.click();
          setAdded(item);
          setToast(false);
          setOpen(false);
          window.setTimeout(clickCartAndCheckout, 100);
        }
        return;
      }

      if (label === "ADD TO CART") {
        const item = detailsFrom(action);
        window.setTimeout(() => showAdded(item), 30);
      }
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  function goToCheckout() {
    setOpen(false);

    const headerButtons = Array.from(
      document.querySelectorAll("header .head-actions button"),
    ) as HTMLButtonElement[];

    const cartButton = headerButtons.find((b) =>
      (b.textContent || "").toUpperCase().includes("CART"),
    );
    cartButton?.click();

    window.setTimeout(() => {
      const placeOrder = Array.from(document.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim().toUpperCase() === "PLACE ORDER",
      ) as HTMLButtonElement | undefined;
      placeOrder?.click();
    }, 150);
  }

  return (
    <>
      {toast && (
        <div className="sg-cart-toast" role="status">
          <CheckCircle2 />
          <span>Added to Cart</span>
        </div>
      )}

      {open && (
        <>
          <button
            aria-label="Close cart confirmation"
            className="sg-cart-overlay"
            onClick={() => setOpen(false)}
          />
          <aside className="sg-cart-drawer" aria-label="Cart confirmation">
            <div className="sg-cart-head">
              <div>
                <ShoppingBag />
                <strong>Added to your cart</strong>
              </div>
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            {added && (
              <div className="sg-added-product">
                {added.image && <img src={added.image} alt={added.name} />}
                <div>
                  <b>{added.name}</b>
                  {added.price && <span>{added.price}</span>}
                  <small>✓ Product successfully added</small>
                </div>
              </div>
            )}

            <button className="sg-continue" onClick={() => setOpen(false)}>
              CONTINUE SHOPPING
            </button>
            <button className="sg-checkout" onClick={goToCheckout}>
              PROCEED TO CHECKOUT
            </button>
          </aside>
        </>
      )}

      <style jsx global>{`
        .sg-cart-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          color: #3e0a0e;
          border: 1px solid #d9b56b;
          box-shadow: 0 12px 35px rgba(45, 10, 12, .2);
          padding: 13px 18px;
          border-radius: 8px;
          font-weight: 800;
        }
        .sg-cart-toast svg { width: 21px; color: #288a42; }
        .sg-cart-overlay {
          position: fixed;
          inset: 0;
          z-index: 160;
          border: 0;
          background: rgba(25, 4, 7, .45);
        }
        .sg-cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 170;
          width: min(430px, 94vw);
          background: #fffaf4;
          box-shadow: -16px 0 50px rgba(37, 6, 9, .25);
          padding: 24px;
          display: flex;
          flex-direction: column;
          animation: sgCartIn .22s ease-out;
        }
        @keyframes sgCartIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .sg-cart-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 18px;
          border-bottom: 1px solid #eadfd5;
          color: #3e0a0e;
        }
        .sg-cart-head > div { display: flex; align-items: center; gap: 10px; }
        .sg-cart-head svg { width: 21px; }
        .sg-cart-head button {
          border: 0;
          background: transparent;
          padding: 5px;
        }
        .sg-added-product {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 14px;
          align-items: center;
          padding: 22px 0;
          border-bottom: 1px solid #eadfd5;
        }
        .sg-added-product img {
          width: 92px;
          height: 92px;
          object-fit: cover;
          border: 1px solid #eadfd5;
          background: white;
        }
        .sg-added-product b,
        .sg-added-product span,
        .sg-added-product small { display: block; }
        .sg-added-product b { color: #3e0a0e; margin-bottom: 8px; }
        .sg-added-product span {
          font-weight: 800;
          color: #9b6518;
          margin-bottom: 7px;
        }
        .sg-added-product small { color: #397a44; }
        .sg-continue,
        .sg-checkout {
          width: 100%;
          padding: 14px 16px;
          font-weight: 800;
          letter-spacing: .4px;
        }
        .sg-continue {
          margin-top: auto;
          background: #fff;
          color: #3e0a0e;
          border: 1px solid #3e0a0e;
        }
        .sg-checkout {
          margin-top: 10px;
          background: #3e0a0e;
          color: #fff;
          border: 1px solid #3e0a0e;
        }
        @media (max-width: 640px) {
          .sg-cart-toast {
            top: 12px;
            right: 12px;
            left: 12px;
            justify-content: center;
          }
          .sg-cart-drawer { width: 100%; }
        }
      `}</style>
    </>
  );
}
