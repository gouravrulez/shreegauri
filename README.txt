SHREE GAURI — PHONEPE PREPARATION PACKAGE
=========================================

This package prepares PhonePe Standard Checkout without activating it yet.
Razorpay remains the default payment provider until PAYMENT_PROVIDER=phonepe is added in Vercel.

FILES TO UPLOAD TO THE ROOT OF THE GITHUB REPOSITORY:
- package.json
- scripts/apply-phonepe-prep.mjs
- app/lib/phonepe.ts
- app/api/payments/create/route.ts
- app/api/payments/status/route.ts
- app/api/payments/phonepe-webhook/route.ts
- app/payment-return/page.tsx

DO NOT ADD PHONEPE SECRETS YET unless the PhonePe account is approved.

After PhonePe approval, add these Vercel Production environment variables:
- PAYMENT_PROVIDER = phonepe
- PHONEPE_CLIENT_ID = value from PhonePe
- PHONEPE_CLIENT_SECRET = matching secret from PhonePe
- PHONEPE_CLIENT_VERSION = value supplied by PhonePe (usually 1)
- PHONEPE_ENV = PRODUCTION

For webhook/callback verification, configure a username/password in PhonePe and add:
- PHONEPE_CALLBACK_USERNAME
- PHONEPE_CALLBACK_PASSWORD

PhonePe callback URL:
https://shreegauri.in/api/payments/phonepe-webhook

Never paste client secrets or callback passwords into chat.
