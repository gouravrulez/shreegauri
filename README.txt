Upload the scripts folder to the ROOT of your existing shreegauri GitHub repo.
Then edit package.json and add this to the END of the existing prebuild command:
 && node scripts/apply-phonepe-finalization-fix.mjs

Wait for Vercel deployment to show Ready. Do not make another payment before that.
The live Supabase payment finalizer has already been corrected separately.
