SHREE GAURI — PAID ORDER EMAIL + WHATSAPP NOTIFICATIONS

FILES
1) app/api/payments/verify/route.ts
   Replace the existing file with this one.

2) app/lib/order-notifications.ts
   Add this new file.

WHAT IT DOES
- Runs only after Razorpay signature verification succeeds and the order is finalized as paid.
- Sends an email notification to:
  gauritechnologiespvt@gmail.com
- Sends a WhatsApp template notification to:
  +91 7400617601
- Notification failures DO NOT make a successful customer payment fail.
- Current checkout/storefront design is unchanged.

VERCEL ENVIRONMENT VARIABLES

EMAIL (Resend)
RESEND_API_KEY=your_resend_api_key
ORDER_EMAIL_FROM=Shree Gauri <orders@your-verified-domain>
ORDER_NOTIFICATION_EMAIL=gauritechnologiespvt@gmail.com

WHATSAPP (Meta WhatsApp Cloud API)
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ADMIN_PHONE=917400617601
WHATSAPP_ORDER_TEMPLATE=new_order_admin
WHATSAPP_TEMPLATE_LANGUAGE=en

WHATSAPP TEMPLATE BODY
Create an approved Meta WhatsApp template named:
new_order_admin

Suggested template:
New paid order {{1}}
Customer: {{2}}
Phone: {{3}}
Amount: {{4}}
Open Shree Gauri Admin for full order details.

IMPORTANT
- Never put API keys/tokens in GitHub source files.
- Add all secrets only in Vercel Production Environment Variables.
- Redeploy after adding/changing environment variables.
- Keep Razorpay in Test Mode while testing notifications.
