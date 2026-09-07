SHREE GAURI ZERO-COST AUTH CLEANUP

Upload the CONTENTS of this ZIP to the ROOT of gouravrulez/shreegauri.
Replace package.json and upload scripts/apply-zero-cost-auth-cleanup.mjs.
Commit and wait for Vercel READY.

Result:
- Email OTP stays active and working.
- Mobile OTP button is hidden because real SMS delivery needs an SMS provider.
- Customer mobile number remains available in Profile / Address / Checkout.
- Existing automatic order-confirmation EMAIL remains unchanged.
- PhonePe/payment logic is not changed by this package.
- No paid SMS/WhatsApp service is added.
