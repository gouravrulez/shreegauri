SHREE GAURI ACCOUNT + CHECKOUT UPGRADE

What this package adds:
- Mandatory customer login before checkout/payment.
- Cart persistence while the customer goes to login.
- OTP-based login/signup (email OTP or mobile OTP).
- Multiple saved delivery addresses.
- Default address selection.
- Automatic customer/address autofill at checkout.
- Orders linked to the authenticated customer account.
- My Orders with payment/order/tracking status.
- On-site order confirmation page with View My Orders.
- PhonePe-only checkout route in this package.

Database work:
- customer_addresses table + RLS + default-address RPC already applied to production Supabase.
- create_store_order was updated in production to require/link authenticated customer IDs.

IMPORTANT AFTER DEPLOYMENT:
1. Configure Supabase Auth Email template to send {{ .Token }} (OTP), not a confirmation link.
2. Use your verified custom SMTP/Resend sender so emails show Shree Gauri, not Supabase.
3. Mobile OTP requires an SMS provider configured in Supabase Auth. In India, branded sender IDs generally require provider/DLT setup; the website code alone cannot make an SMS sender display 'Shree Gauri'.
4. Redeploy Vercel after uploading these files.
