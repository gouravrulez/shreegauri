SHREE GAURI INTERNATIONAL STOREFRONT UPGRADE — 9 SEPTEMBER 2026

Built on the verified Shree Gauri recovery source from commit 3ab555d5ccdf5bcd557d5a38ce5d9a335129d4ed.

Added:
- Country/region selector.
- Display currencies: INR, USD, GBP, EUR, AED, CAD, AUD and SGD.
- Approximate non-INR display conversion with clear disclosure.
- International address labels for country, state/province/region and postal/ZIP code.
- International shipping, customs/duties and taxes wording.
- International SEO metadata and canonical domain.
- Mobile-responsive country/currency controls.
- International checkout guard so PhonePe India remains unchanged and international payment is not falsely enabled.
- Removed unsupported universal free-shipping and absolute authenticity claims in touched storefront areas.

IMPORTANT PAYMENT BEHAVIOUR:
PhonePe India checkout remains enabled exactly as before. International online payment is intentionally NOT enabled until a compatible approved payment gateway/configuration is added. Customers outside India see a transparent contact message instead of a payment flow that may fail.

No Supabase keys, PhonePe secrets, Resend keys or other environment secrets are included or changed by this upgrade.
