-- Tetrasan Time-Tracking App - Migration Verification
-- Migration: 20251015_verification.sql
-- Description: Verification queries to ensure migration was successful

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check if all tables exist
SELECT 
  'Tables Check' as test_category,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ PASS: All 6 core tables exist'
    ELSE '❌ FAIL: Expected 6 tables, found ' || COUNT(*)
  END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'timesheet_entries', 'timesheet_corrections', 'leave_requests', 'inbox_events', 'timesheet_months');

-- Check if RLS is enabled on all tables
SELECT 
  'RLS Check' as test_category,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ PASS: RLS enabled on all tables'
    ELSE '❌ FAIL: Expected 6 tables with RLS, found ' || COUNT(*)
  END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'timesheet_entries', 'timesheet_corrections', 'leave_requests', 'inbox_events', 'timesheet_months')
AND rowsecurity = true;

-- Check if storage buckets exist
SELECT 
  'Storage Check' as test_category,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS: Both storage buckets exist'
    ELSE '❌ FAIL: Expected 2 storage buckets, found ' || COUNT(*)
  END as result
FROM storage.buckets 
WHERE id IN ('forms-templates', 'forms-uploads');

-- Check if helper functions exist
SELECT 
  'Functions Check' as test_category,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ PASS: All helper functions exist'
    ELSE '❌ FAIL: Expected 3 functions, found ' || COUNT(*)
  END as result
FROM pg_proc 
WHERE proname IN ('is_admin', 'is_owner', 'is_month_open')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if enums exist
SELECT 
  'Enums Check' as test_category,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ PASS: All 5 enums exist'
    ELSE '❌ FAIL: Expected 5 enums, found ' || COUNT(*)
  END as result
FROM pg_type 
WHERE typname IN ('role_enum', 'timesheet_status_enum', 'request_type_enum', 'request_status_enum', 'month_status_enum')
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if indexes exist
SELECT 
  'Indexes Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ PASS: All required indexes exist'
    ELSE '❌ FAIL: Expected at least 7 indexes, found ' || COUNT(*)
  END as result
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('profiles_email_idx', 'timesheet_entries_employee_date_idx', 'timesheet_corrections_entry_created_idx', 
                  'leave_requests_employee_created_idx', 'inbox_events_created_idx', 'timesheet_months_employee_year_month_idx');

-- Check if triggers exist
SELECT 
  'Triggers Check' as test_category,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS: Both update triggers exist'
    ELSE '❌ FAIL: Expected 2 triggers, found ' || COUNT(*)
  END as result
FROM pg_trigger 
WHERE tgname IN ('update_profiles_updated_at', 'update_timesheet_entries_updated_at')
AND tgrelid IN (
  SELECT oid FROM pg_class 
  WHERE relname IN ('profiles', 'timesheet_entries')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- Check if policies exist
SELECT 
  'Policies Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS: All RLS policies exist'
    ELSE '❌ FAIL: Expected at least 20 policies, found ' || COUNT(*)
  END as result
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'timesheet_entries', 'timesheet_corrections', 'leave_requests', 'inbox_events', 'timesheet_months');

-- Check if storage policies exist
SELECT 
  'Storage Policies Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ PASS: All storage policies exist'
    ELSE '❌ FAIL: Expected at least 8 storage policies, found ' || COUNT(*)
  END as result
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE 'forms_%';

-- Check seed data
SELECT 
  'Seed Data Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS: Seed profiles exist'
    ELSE '❌ FAIL: Expected at least 3 profiles, found ' || COUNT(*)
  END as result
FROM profiles;

-- Check if admin profile exists
SELECT 
  'Admin Profile Check' as test_category,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: Admin profile exists'
    ELSE '❌ FAIL: Expected 1 admin profile, found ' || COUNT(*)
  END as result
FROM profiles 
WHERE role = 'admin' AND email = 'admin@tetrasan.de';

-- Check if employee profiles exist
SELECT 
  'Employee Profiles Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS: Employee profiles exist'
    ELSE '❌ FAIL: Expected at least 2 employee profiles, found ' || COUNT(*)
  END as result
FROM profiles 
WHERE role = 'employee';

-- Check if timesheet months exist
SELECT 
  'Timesheet Months Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS: Timesheet months exist'
    ELSE '❌ FAIL: Expected at least 2 timesheet months, found ' || COUNT(*)
  END as result
FROM timesheet_months;

-- Check if sample data exists
SELECT 
  'Sample Data Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS: Sample timesheet entries exist'
    ELSE '❌ FAIL: Expected at least 2 timesheet entries, found ' || COUNT(*)
  END as result
FROM timesheet_entries;

-- Check if leave requests exist
SELECT 
  'Leave Requests Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS: Sample leave requests exist'
    ELSE '❌ FAIL: Expected at least 2 leave requests, found ' || COUNT(*)
  END as result
FROM leave_requests;

-- Check if inbox events exist
SELECT 
  'Inbox Events Check' as test_category,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS: Sample inbox events exist'
    ELSE '❌ FAIL: Expected at least 2 inbox events, found ' || COUNT(*)
  END as result
FROM inbox_events;

-- ===========================================
-- SUMMARY
-- ===========================================

SELECT '===========================================' as summary;
SELECT 'MIGRATION VERIFICATION COMPLETE' as summary;
SELECT '===========================================' as summary;
SELECT 'All tests above should show ✅ PASS results' as summary;
SELECT 'If any ❌ FAIL results, check the migration' as summary;
SELECT '===========================================' as summary;
