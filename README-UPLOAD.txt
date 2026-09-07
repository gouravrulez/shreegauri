SHREE GAURI IMAGE SPEED FIX

Upload the CONTENTS of this ZIP to the ROOT of gouravrulez/shreegauri.

Replace package.json when GitHub asks.
Upload scripts/apply-image-speed-fix.mjs into the scripts folder.
Commit changes and wait for Vercel READY.

What this changes:
- Product grid requests ~520px optimized Supabase thumbnails instead of full originals.
- Category cards request ~240px thumbnails.
- Cart requests ~160px thumbnails.
- Lazy loading + async image decoding.
- Original product images remain unchanged in storage and available for detail views.
- No PhonePe/payment/database/admin/design changes.
