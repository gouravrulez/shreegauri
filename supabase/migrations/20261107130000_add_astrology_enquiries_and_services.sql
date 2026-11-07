alter table public.site_settings
  add column if not exists astrology_services jsonb not null
  default '[{"name":"Kundali Analysis","description":"Detailed interpretation of your birth chart, planetary placements and key life areas.","active":true},{"name":"Gemstone Consultation","description":"Personalised gemstone recommendations based on your birth chart.","active":true}]'::jsonb;

create table if not exists public.astrology_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  mobile text not null check (char_length(mobile) between 7 and 25),
  email text not null check (char_length(email) <= 254),
  address text not null check (char_length(address) between 5 and 500),
  service text not null check (char_length(service) between 2 and 120),
  preferred_time text,
  details text,
  status text not null default 'new' check (status in ('new','contacted','in_progress','completed','closed')),
  email_status text not null default 'pending' check (email_status in ('pending','sent','failed','not_configured')),
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists astrology_enquiries_created_at_idx on public.astrology_enquiries (created_at desc);
alter table public.astrology_enquiries enable row level security;
revoke all on public.astrology_enquiries from anon, authenticated;
grant all on public.astrology_enquiries to service_role;
