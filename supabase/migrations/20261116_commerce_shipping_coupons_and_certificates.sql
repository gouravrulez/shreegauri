-- Shree Gauri commerce expansion (additive only).
-- This migration preserves all existing rows and product/order data.

alter table public.products
  add column if not exists certificate_available boolean not null default false,
  add column if not exists certificate_price_inr numeric(12,2) not null default 0,
  add column if not exists has_size_options boolean not null default false,
  add column if not exists custom_shipping_enabled boolean not null default false,
  add column if not exists custom_shipping_charge_inr numeric(12,2) not null default 0;

alter table public.order_items
  add column if not exists certificate_selected boolean not null default false,
  add column if not exists certificate_price_inr numeric(12,2) not null default 0,
  add column if not exists selected_options jsonb not null default '{}'::jsonb;

alter table public.orders
  add column if not exists courier_company_id uuid,
  add column if not exists courier_charge_inr numeric(12,2) not null default 0,
  add column if not exists expected_delivery_date date,
  add column if not exists dispatch_date date,
  add column if not exists tracking_updated_at timestamptz,
  add column if not exists coupon_code text,
  add column if not exists coupon_discount_inr numeric(12,2) not null default 0;

-- Extend the existing coupon engine instead of replacing it.
alter table public.promo_codes
  add column if not exists is_public boolean not null default true,
  add column if not exists show_on_dashboard boolean not null default true,
  add column if not exists per_customer_limit integer,
  add column if not exists applies_to text not null default 'all',
  add column if not exists product_ids uuid[] not null default '{}',
  add column if not exists category_ids uuid[] not null default '{}';

create table if not exists public.shipping_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tracking_url_template text,
  default_charge_inr numeric(12,2) not null default 0 check (default_charge_inr >= 0),
  estimated_min_days integer not null default 3 check (estimated_min_days >= 0),
  estimated_max_days integer not null default 7 check (estimated_max_days >= estimated_min_days),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_settings (
  id integer primary key default 1 check (id = 1),
  default_shipping_charge_inr numeric(12,2) not null default 0 check (default_shipping_charge_inr >= 0),
  free_shipping_threshold_inr numeric(12,2),
  free_shipping_enabled boolean not null default false,
  default_min_delivery_days integer not null default 3,
  default_max_delivery_days integer not null default 7,
  updated_at timestamptz not null default now()
);
insert into public.shipping_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  minimum_order_inr numeric(12,2) not null default 0 check (minimum_order_inr >= 0),
  maximum_discount_inr numeric(12,2),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  per_customer_limit integer,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  is_public boolean not null default true,
  show_on_dashboard boolean not null default true,
  applies_to text not null default 'all' check (applies_to in ('all','products','categories')),
  product_ids uuid[] not null default '{}',
  category_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists discount_coupons_active_public_idx on public.discount_coupons (is_active, is_public, starts_at, expires_at);
create index if not exists orders_tracking_number_idx on public.orders (tracking_number);
create index if not exists orders_coupon_code_idx on public.orders (coupon_code);

alter table public.shipping_companies enable row level security;
alter table public.shipping_settings enable row level security;
alter table public.discount_coupons enable row level security;

drop policy if exists admins_manage_shipping_companies on public.shipping_companies;
create policy admins_manage_shipping_companies on public.shipping_companies for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists public_read_active_shipping_companies on public.shipping_companies;
create policy public_read_active_shipping_companies on public.shipping_companies for select using (is_active = true or private.is_admin());

drop policy if exists admins_manage_shipping_settings on public.shipping_settings;
create policy admins_manage_shipping_settings on public.shipping_settings for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists public_read_shipping_settings on public.shipping_settings;
create policy public_read_shipping_settings on public.shipping_settings for select using (true);

drop policy if exists admins_manage_discount_coupons on public.discount_coupons;
create policy admins_manage_discount_coupons on public.discount_coupons for all using (private.is_admin()) with check (private.is_admin());
drop policy if exists public_read_usable_public_coupons on public.discount_coupons;
create policy public_read_usable_public_coupons on public.discount_coupons for select using (
  is_active = true and is_public = true and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at >= now())
);

-- Existing product_variants already supports option labels, prices, and stock.
-- Existing orders already have courier_name, tracking_number, and tracking_url.
-- Existing orders also retain subtotal_inr, shipping_inr, discount_inr, and total_inr.
