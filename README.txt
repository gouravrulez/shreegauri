SHREE GAURI OTP FINAL V2

Root cause fixed:
The previous OTP challenge table was in Supabase's private schema.
The website API accessed Supabase through PostgREST, which does not expose that schema.
Therefore the OTP send route failed before the email was sent.

The live database now has public.email_otp_challenges with:
- RLS enabled
- no anon/authenticated access
- service_role-only CRUD

Upload this ZIP contents to the repository root.
