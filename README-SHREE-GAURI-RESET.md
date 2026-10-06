# SHREE GAURI — CUSTOMER & ORDER RESET

This package adds a **manual, production-safe reset tool** to the existing Shree Gauri Next.js/Supabase project.

## What it does

The reset tool is deliberately NOT part of the Vercel build.

It has mandatory safety gates:

1. Creates a local backup of customer/order/auth data.
2. Verifies that the backup is readable.
3. Runs a read-only dry run.
4. Refuses to continue unless administrator identities can be verified.
5. Requires BOTH `--execute` and `--confirm-reset` before deletion.
6. Deletes customer/order data only.
7. Preserves administrator accounts.
8. Performs post-reset verification.

It does **not** delete products, product images, categories, coupons, PhonePe settings, Vercel settings, or application code.

## Before running

Create a temporary local environment containing:

```text
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Never put the service-role key in:
- GitHub
- browser/client code
- `NEXT_PUBLIC_*` variables
- the committed `.env` file

The project already has Supabase client configuration. The reset script uses the service-role key only when run manually.

## Mandatory dry run

From the project root:

```bash
npm install
npm run sg:reset
```

This creates a confidential backup under:

```text
backups/shreegauri-reset-<timestamp>.json
```

and prints the records that would be deleted.

**Nothing is deleted during this command.**

Review the output carefully.

## Execute only after reviewing the dry run

```bash
npm run sg:reset -- --execute --confirm-reset
```

If backup creation, verification, admin detection, or deletion encounters an unexpected condition, the script stops.

## GitHub / Vercel

You may upload this project to GitHub and deploy it to Vercel normally.

The reset script is NOT automatically executed by `next build`.

Do not upload the generated `backups/` directory to GitHub.

The `.gitignore` included in this package protects those backup files.

## Important

A Supabase service-role key has full administrative privileges. Treat it like a master database password.

After completing the one-time reset, remove the temporary local service-role environment variable and securely retain the backup according to your business/data-retention requirements.
