-- Already applied to production Supabase on 2026-09-04.
-- Kept here as a backup/reference for the customer multiple-address system.
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
