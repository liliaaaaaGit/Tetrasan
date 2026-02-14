-- Migration: Revert employee_holiday_exclusions table
-- Date: 2026-02-14
-- Description: Removes the employee_holiday_exclusions table and all related objects

-- Drop policies first
drop policy if exists "employee_holiday_exclusions_select_own" on public.employee_holiday_exclusions;
drop policy if exists "employee_holiday_exclusions_modify_admin_only" on public.employee_holiday_exclusions;

-- Drop indexes
drop index if exists public.idx_employee_holiday_exclusions_employee_date;
drop index if exists public.idx_employee_holiday_exclusions_date;

-- Drop the table
drop table if exists public.employee_holiday_exclusions;
