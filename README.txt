SHREE GAURI — LAUNCH HARDENING PACKAGE

IMPORTANT: The Supabase database has ALREADY been upgraded by ChatGPT.
Do not run SQL manually.

UPLOAD / REPLACE THESE:
1. package.json -> replace root package.json
2. scripts/apply-launch-hardening.mjs -> upload into existing scripts folder
3. app/api/payments/create/route.ts -> replace
4. app/api/payments/verify/route.ts -> replace
5. app/api/payments/webhook/route.ts -> NEW
6. app/robots.ts -> NEW
7. app/sitemap.ts -> NEW
8. app/contact/page.tsx -> NEW
9. app/privacy/page.tsx -> NEW
10. app/terms/page.tsx -> NEW
11. app/shipping-returns/page.tsx -> NEW

KEEP THESE EXISTING FILES:
- scripts/apply-multi-category.mjs
- scripts/apply-premium-product-manager.mjs
- app/lib/order-notifications.ts
Do not delete them.

WHAT THIS DOES:
- 15-minute inventory reservations without reducing physical stock before payment.
- Prevents another checkout from reserving the same one-of-one stock.
- Physical stock is deducted only after verified captured payment.
- Failed Razorpay order creation releases reservation.
- Duplicate payment finalization is idempotent.
- Checkout verification confirms the Razorpay order belongs to the store order.
- Verification confirms payment status with Razorpay before marking paid.
- Adds optional Razorpay webhook route for captured/failed events.
- Adds courier, AWB/tracking number, tracking URL fields in Admin.
- Adds Packed and Out for Delivery statuses.
- Adds truthful SEO metadata, robots.txt and sitemap.
- Adds Contact, Privacy, Terms, Shipping & Returns pages.
- Removes unsupported "Authentic" claim from global SEO description.
- Does not redesign the storefront.

ONE MANUAL STEP AFTER DEPLOYMENT FOR WEBHOOK:
Create a Vercel Production environment variable named RAZORPAY_WEBHOOK_SECRET with a NEW random secret of your choice.
Then in Razorpay Dashboard create webhook:
URL: https://shreegauri.in/api/payments/webhook
Events: payment.captured and payment.failed
Use the SAME webhook secret.
Never share that secret in chat.

LIVE PAYMENT:
Do not replace Test Razorpay keys with Live keys until the deployment is Ready and a fresh Test Mode checkout succeeds.

SECURITY:
Supabase leaked-password protection is an account dashboard setting and is not changed by these files.
