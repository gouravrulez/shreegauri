SHREE GAURI EMAIL OTP FIX

This patch:
1. Adds /api/auth/email-otp
2. Generates a real 6-digit Supabase OTP server-side
3. Sends it through the existing Resend account with subject:
   Your Shree Gauri Verification Code
4. Keeps Supabase verifyOtp for secure login
5. Does not change PhonePe, checkout, product pages, or storefront design

Upload these files into the existing repository, preserving folders.
