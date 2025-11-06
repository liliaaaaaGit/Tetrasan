-- Migration: Add public.holidays table with RLS and seed 2026 Germany holidays
-- Date: 2025-10-29

-- 1) Table
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  name text not null,
  country text not null default 'DE',
  state text null,                             -- e.g., BY, BW (optional)
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (holiday_date, country, coalesce(state, 'ALL'))
);

-- 2) Index
create index if not exists idx_holidays_date on public.holidays(holiday_date);

-- 3) Enable RLS
alter table public.holidays enable row level security;

-- Helper to detect admins (reuse existing if present, otherwise create)
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.active = true
  );
$$;

-- 4) Policies
drop policy if exists "holidays_select_all_auth" on public.holidays;
create policy "holidays_select_all_auth"
  on public.holidays for select
  to authenticated
  using (true);

drop policy if exists "holidays_modify_admin_only" on public.holidays;
create policy "holidays_modify_admin_only"
  on public.holidays for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5) Seed 2025 and 2026 (Germany-wide + Bavaria-relevant dates from the list)
insert into public.holidays (holiday_date, name, country, state) values
  -- 2025 holidays
  ('2025-11-01','Allerheiligen','DE',null),
  ('2025-12-25','1. Weihnachtstag','DE',null),
  ('2025-12-26','2. Weihnachtstag','DE',null),
  -- 2026 holidays (Germany-wide + Bavaria-relevant dates from the list)
  ('2026-01-01','Neujahr','DE',null),
  ('2026-01-06','Heilige Drei Könige','DE','BY'),
  ('2026-04-03','Karfreitag','DE',null),
  ('2026-04-06','Ostermontag','DE',null),
  ('2026-05-01','Tag der Arbeit','DE',null),
  ('2026-05-14','Christi Himmelfahrt','DE',null),
  ('2026-05-25','Pfingstmontag','DE',null),
  ('2026-06-04','Fronleichnam','DE','BY'),
  ('2026-08-15','Mariä Himmelfahrt','DE','BY'),
  ('2026-10-03','Tag der Deutschen Einheit','DE',null),
  ('2026-12-25','1. Weihnachtstag','DE',null),
  ('2026-12-26','2. Weihnachtstag','DE',null)
on conflict do nothing;

