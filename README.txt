SHREE GAURI — CUSTOMER DASHBOARD + ADMIN CUSTOMERS + PRODUCT DELETE FIX

DATABASE CHANGES ARE ALREADY APPLIED:
- Customer profile fields: DOB and saved address
- New customer signups automatically create/link a customer record
- Existing orders can appear in the logged-in customer's My Orders by linked account/email
- Product deletion FK issue for inventory reservations was fixed

THIS ZIP ALSO INCLUDES THE PREVIOUS MOBILE FOOTER FIX:
- Explore category buttons scroll to the correct product catalogue on mobile
- +91 74006 17601 below the footer email

NEW CUSTOMER ACCOUNT:
- Account Overview
- My Orders
- Order status/payment status
- Courier/tracking link when available
- Profile: name, email, mobile, DOB
- Saved delivery address
- Mobile-responsive dashboard

ADMIN:
- New Customers tab
- Registered-vs-checkout customer status
- Name, email, phone, DOB, saved address
- Number of orders and paid order value
- Recent orders
- Existing Orders/Products/Categories/Reviews remain

UPLOAD ALL CONTENTS OF THIS ZIP INTO THE GITHUB REPOSITORY ROOT:
- package.json (replace existing)
- app/login/customer-login.tsx (replace existing)
- scripts/apply-mobile-footer-fix.mjs
- scripts/apply-customer-admin-upgrade.mjs

Commit changes, then wait for Vercel deployment to show Ready.
