SHREE GAURI — MULTI-CATEGORY PRODUCT SYSTEM

Backend:
The products table has already been upgraded with a category_ids UUID array.
Existing products were automatically carried over to their current category.

UPLOAD THESE 2 FILES TO GITHUB:
1) package.json  -> replace the existing root package.json
2) scripts/apply-multi-category.mjs -> create the scripts folder if needed and upload this file

HOW IT WORKS:
- Vercel runs npm run build.
- The new prebuild step safely updates the current Admin and Storefront source during the build.
- Admin Product form changes from one Category dropdown to multiple checkboxes.
- You can select multiple Shop by Category / Purpose / Planet entries for one product.
- The product remains ONE product and ONE stock record.
- On the storefront it appears under every selected category.
- On All Products it appears only once.
- Existing single-category products continue working.
- Payment/order code is not changed.

AFTER UPLOAD:
Wait for Vercel Production deployment to show Ready.
Then open /admin -> Products & Inventory -> Add Product.
You should see: "Categories — select one or more".

IMPORTANT:
Do not delete app/storefront.tsx or app/admin/admin-dashboard.tsx.
The build script modifies them only inside Vercel's build copy.
