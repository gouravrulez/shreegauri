SHREE GAURI — CHECKOUT + ORDERS UPDATE

Upload the CONTENTS of this folder to the ROOT of the shreegauri-new GitHub repository and replace the existing files.

What this update adds:
- Variant-aware shopping bag
- Checkout page for customer name, phone, email and Indian shipping address
- Secure server-side order creation through Supabase Edge Function
- Live price/stock validation in the database before an order is accepted
- Inventory reduction when an order is placed
- Pending order/payment state (payment gateway is intentionally not connected yet)
- Orders section in admin dashboard with customer, delivery, items, payment status and order status
- Admin can update order/payment statuses

Important:
- Shipping fees are NOT configured yet. Checkout says shipping will be confirmed separately.
- Online payment is NOT configured yet. Do not tell customers that online payment succeeded until a payment gateway is integrated.
- Existing storefront design is preserved aside from functional checkout controls.
