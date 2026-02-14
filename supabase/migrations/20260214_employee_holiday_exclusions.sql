-- Migration: Add employee_holiday_exclusions table
-- Date: 2026-02-14
-- Description: Allows admins to exclude specific holidays for individual employees
-- This does NOT change existing holiday fetching logic - exclusions are applied separately

-- 1) Table to track deleted holidays per employee
create table if not exists public.employee_holiday_exclusions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  holiday_date date not null,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  unique (employee_id, holiday_date)
);

-- 2) Index for efficient lookups
create index if not exists idx_employee_holiday_exclusions_employee_date 
  on public.employee_holiday_exclusions(employee_id, holiday_date);
create index if not exists idx_employee_holiday_exclusions_date 
  on public.employee_holiday_exclusions(holiday_date);

-- 3) Enable RLS
alter table public.employee_holiday_exclusions enable row level security;

-- 4) Policies
-- Employees can see their own exclusions (read-only)
drop policy if exists "employee_holiday_exclusions_select_own" on public.employee_holiday_exclusions;
create policy "employee_holiday_exclusions_select_own"
  on public.employee_holiday_exclusions for select
  to authenticated
  using (
    auth.role() = 'authenticated' and (
      is_admin() or
      is_owner(employee_id)
    )
  );

-- Only admins can create/delete exclusions
drop policy if exists "employee_holiday_exclusions_modify_admin_only" on public.employee_holiday_exclusions;
create policy "employee_holiday_exclusions_modify_admin_only"
  on public.employee_holiday_exclusions for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- 5) Comment
comment on table public.employee_holiday_exclusions is 
  'Tracks holidays that have been excluded (deleted) for specific employees by admins';
