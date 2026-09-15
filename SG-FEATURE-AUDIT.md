# Shree Gauri — Feature Restoration & KAOMA-Parity Audit

Working branch: `SG-FEATURE-RESTORE`
Safety backup: `SG-CLEAN-RECOVERY` (do not modify)
Production branch: `Main-Branch-SG`

## A. Confirmed already present in recovered Shree Gauri
- Supabase-backed storefront/admin foundation
- Email OTP API routes and customer login flow
- Mandatory authenticated customer before checkout/payment
- Cart persistence through login
- Saved delivery addresses + default address
- Checkout customer/address autofill
- Orders linked to authenticated customer
- My Orders with payment/order/tracking status
- On-site payment/order return page
- PhonePe create/status/verify/webhook integration
- Order notification helper
- Products, categories, multiple product images
- Reviews foundation
- Admin products/categories/orders/customers/reviews/site settings foundation

## B. Restore/verify from our later Shree Gauri work
- Product multi-category assignment
- Premium product manager and gemstone-specific fields
- Inventory hardening / one-of-one stock behavior
- Order fulfillment, courier, tracking number/link and refund status
- Customer dashboard/profile/address book polish
- Product image loading/performance optimization
- Add-to-cart confirmation and working Buy Now path
- Coupons: compact apply UI, validation and authoritative discount calculation
- Mobile product catalogue: two product cards per row
- Filters/sorting/wishlist behavior
- Featured / Best Seller / New Arrival controls

## C. KAOMA-level functionality to bring to Shree Gauri (functionality only)
- Product variants where relevant: size, colour, SKU, variant stock, optional variant price/image
- Free-size option
- Product share link
- Similar products
- Customer profile photo support where appropriate
- Full country selector and international phone country codes
- Country-aware address fields and postal-code labels
- Broad currency display with INR as authoritative base
- Approximate converted-price disclosure
- India/international shipping-rule structure
- Admin-editable shipping charges and free-shipping thresholds
- International availability messaging without pretending international payment is enabled
- Strong mobile checkout/account/admin layouts
- Fast product/dashboard loading

## D. Admin business control centre target
- Overview metrics: orders, revenue, customers, low stock
- Products + inventory + variants
- Categories/subcategories + multi-category assignment
- Orders + fulfillment/tracking/refund state
- Customers
- Reviews moderation
- Coupons/promotions
- Homepage/site content and images
- Featured/Best Seller/New Arrival merchandising
- Shipping rules: India and international
- Currency/display settings
- International settings
- Gemstone-specific product attributes
- Admin access verification/authorization, not merely any logged-in Supabase session

## E. Checkout/payment rules
- Keep existing PhonePe India integration intact
- Never store payment secrets in GitHub/client code
- Server-side authoritative product prices, discounts, shipping and order total
- Do not enable/fake international online payment until a compatible approved gateway is configured
- Successful payment must confirm order, update inventory and trigger customer/admin order notifications

## F. Brand/design constraints
- Shree Gauri remains jewellery/spiritual only
- Do not copy KAOMA branding, design, content or products
- Preserve approved Shree Gauri logo, Maa Lakshmi hero and founder identity
- No public admin login in customer navigation
- Customer login remains visible
- Bright/prosperous spiritual visual direction; no arbitrary redesign

## G. Release process
1. Implement only on `SG-FEATURE-RESTORE`.
2. Keep `SG-CLEAN-RECOVERY` untouched.
3. Verify build/deployment after meaningful batches.
4. Verify storefront, admin, OTP/account and checkout behavior.
5. Merge/reset production only after the feature branch is green and reviewed.
