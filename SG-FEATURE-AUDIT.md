# Shree Gauri — Feature Restoration & KAOMA-Parity Audit

Working branch: `SG-FEATURE-RESTORE`
Safety backup: `SG-CLEAN-RECOVERY` (do not modify)
Production branch: `Main-Branch-SG`

## Verified recovered build
The recovered Shree Gauri project already runs its restoration scripts during `prebuild`. These include multi-category products, premium product manager, launch hardening, PhonePe preparation/finalization/type fixes, mobile/footer fixes, customer/admin upgrades, customer checkout upgrades, Email OTP, login/profile-photo support, image-speed optimization, and zero-cost auth cleanup.

The feature-restore branch passed its Vercel status check with this recovered build chain intact.

## Confirmed application foundation
- Supabase-backed storefront/admin foundation
- Email OTP API routes and customer login flow
- Authenticated customer checkout/payment flow
- Cart persistence through login
- Saved delivery addresses + default address
- Checkout customer/address autofill
- Orders linked to authenticated customer
- My Orders with payment/order/tracking status
- PhonePe create/status/verify/webhook integration
- Order notification helper
- Products, categories and multiple product images
- Reviews foundation
- Admin products/categories/orders/customers/reviews/site settings foundation
- Multi-category assignment applied by prebuild
- Premium product-manager upgrade applied by prebuild
- Customer/admin and checkout upgrades applied by prebuild
- Product image-speed optimization applied by prebuild

## KAOMA-parity expansion still tracked separately
Functionality useful to Shree Gauri, without copying KAOMA branding/design/content:
- Product variants where relevant: size, colour, SKU, variant stock, optional variant price/image
- Free-size option
- Product share link and similar products
- Full country selector and international phone country codes
- Country-aware addresses
- Broad currency display with INR as authoritative base
- India/international shipping-rule structure
- Admin-editable shipping charges and free-shipping thresholds
- Stronger international/account/admin UX where needed
- Back-in-stock notifications and cart recovery where appropriate
- Strong admin authorization
- SEO/sitemap/robots and performance hardening

## Payment and international rules
- Keep the existing PhonePe India integration intact.
- Never store payment secrets in GitHub/client code.
- Server must remain authoritative for prices, discounts, shipping and order totals.
- Do not pretend international online payment is available until a compatible approved gateway is configured.

## Brand/design constraints
- Shree Gauri remains jewellery/spiritual only.
- Do not copy KAOMA branding, design, content or products.
- Preserve approved Shree Gauri logo, Maa Lakshmi hero and founder identity.
- No public admin login in customer navigation.
- Customer login remains visible.

## Safety/release
- `SG-CLEAN-RECOVERY` remains untouched as emergency backup.
- `Main-Branch-SG` is only advanced after a Vercel-successful feature commit.
