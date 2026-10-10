create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  reason text not null,
  location text not null,
  appointment text,
  message text not null,
  consented_at timestamptz not null
);

alter table public.enquiries enable row level security;

-- No public insert/select policy. The server route writes with the service-role key.
-- Configure a retention schedule and delete enquiries when no longer required.
