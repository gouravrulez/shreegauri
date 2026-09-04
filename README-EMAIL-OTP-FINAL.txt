SHREE GAURI SECURE EMAIL OTP FINAL FIX

The required database migration has already been applied to the live Supabase project.

Upload this ZIP contents to the existing repository root, preserving folders.

This flow:
- generates a private 6-digit OTP
- stores only an HMAC hash in Supabase private schema
- expires after 10 minutes
- allows 5 attempts
- rate-limits resend to 60 seconds per email
- sends from Shree Gauri using existing Resend settings
- creates a normal Supabase Auth session only after the correct email OTP is entered
- keeps PhonePe/payment/storefront unchanged
