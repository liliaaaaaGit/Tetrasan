-- Tetrasan Time-Tracking App - RLS and Constraints Verification
-- File: supabase/tests/verification.sql
-- Description: Comprehensive tests to verify RLS policies and constraints work correctly

-- ===========================================
-- SETUP TEST USERS
-- ===========================================

-- Create test admin user
INSERT INTO profiles (id, email, full_name, role, active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@test.com',
  'Test Admin',
  'admin',
  true
);

-- Create test employee user
INSERT INTO profiles (id, email, full_name, role, active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'employee@test.com',
  'Test Employee',
  'employee',
  true
);

-- Create another test employee
INSERT INTO profiles (id, email, full_name, role, active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'employee2@test.com',
  'Test Employee 2',
  'employee',
  true
);

-- ===========================================
-- HELPER FUNCTIONS FOR TESTING
-- ===========================================

-- Function to test as a specific user
CREATE OR REPLACE FUNCTION test_as_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the auth.uid() for testing
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id::text)::text, true);
END;
$$;

-- Function to reset auth context
CREATE OR REPLACE FUNCTION reset_auth()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', NULL, true);
END;
$$;

-- ===========================================
-- TEST 1: BASIC RLS POLICIES
-- ===========================================

-- Test 1.1: Employee can see only own profile
SELECT 'TEST 1.1: Employee sees only own profile' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

-- Should return only employee's own profile
SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND (SELECT email FROM profiles WHERE id = '22222222-2222-2222-2222-222222222222') = 'employee@test.com'
    THEN '✅ PASS: Employee sees only own profile'
    ELSE '❌ FAIL: Employee sees wrong profiles'
  END as result
FROM profiles;

-- Test 1.2: Admin can see all profiles
SELECT 'TEST 1.2: Admin sees all profiles' as test_name;

SELECT test_as_user('11111111-1111-1111-1111-111111111111');

-- Should return all profiles
SELECT 
  CASE 
    WHEN COUNT(*) = 3
    THEN '✅ PASS: Admin sees all profiles'
    ELSE '❌ FAIL: Admin does not see all profiles'
  END as result
FROM profiles;

-- ===========================================
-- TEST 2: TIMESHEET ENTRIES RLS
-- ===========================================

-- Create test timesheet entries
INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, hours_decimal, status, activity_note)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '2024-12-01', '09:00', '17:00', 8.0, 'work', 'Development work'),
  ('33333333-3333-3333-3333-333333333333', '2024-12-01', '08:00', '16:00', 8.0, 'work', 'Testing work');

-- Test 2.1: Employee can see only own timesheet entries
SELECT 'TEST 2.1: Employee sees only own timesheet entries' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND (SELECT employee_id FROM timesheet_entries LIMIT 1) = '22222222-2222-2222-2222-222222222222'
    THEN '✅ PASS: Employee sees only own timesheet entries'
    ELSE '❌ FAIL: Employee sees other timesheet entries'
  END as result
FROM timesheet_entries;

-- Test 2.2: Admin can see all timesheet entries
SELECT 'TEST 2.2: Admin sees all timesheet entries' as test_name;

SELECT test_as_user('11111111-1111-1111-1111-111111111111');

SELECT 
  CASE 
    WHEN COUNT(*) = 2
    THEN '✅ PASS: Admin sees all timesheet entries'
    ELSE '❌ FAIL: Admin does not see all timesheet entries'
  END as result
FROM timesheet_entries;

-- ===========================================
-- TEST 3: MONTH LOCK FUNCTIONALITY
-- ===========================================

-- Create timesheet_months record for current month (approved)
INSERT INTO timesheet_months (employee_id, year, month, status, approved_by)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 2024, 12, 'approved', '11111111-1111-1111-1111-111111111111');

-- Test 3.1: Employee cannot insert into approved month
SELECT 'TEST 3.1: Employee cannot insert into approved month' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

-- This should fail
DO $$
BEGIN
  INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, hours_decimal, status, activity_note)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-12-15', '09:00', '17:00', 8.0, 'work', 'Test work');
  
  RAISE EXCEPTION '❌ FAIL: Employee was able to insert into approved month';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ PASS: Employee cannot insert into approved month';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Unexpected error: %', SQLERRM;
END;
$$;

-- Test 3.2: Admin can insert into approved month
SELECT 'TEST 3.2: Admin can insert into approved month' as test_name;

SELECT test_as_user('11111111-1111-1111-1111-111111111111');

-- This should succeed
DO $$
BEGIN
  INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, hours_decimal, status, activity_note)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-12-15', '09:00', '17:00', 8.0, 'work', 'Admin correction');
  
  RAISE NOTICE '✅ PASS: Admin can insert into approved month';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Admin cannot insert into approved month: %', SQLERRM;
END;
$$;

-- ===========================================
-- TEST 4: TIMESHEET CORRECTIONS RLS
-- ===========================================

-- Create a timesheet correction
INSERT INTO timesheet_corrections (entry_id, admin_id, corrected_hours_decimal, note)
SELECT 
  te.id,
  '11111111-1111-1111-1111-111111111111',
  7.5,
  'Admin correction'
FROM timesheet_entries te
WHERE te.employee_id = '22222222-2222-2222-2222-222222222222'
LIMIT 1;

-- Test 4.1: Employee can see corrections to own entries
SELECT 'TEST 4.1: Employee can see corrections to own entries' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

SELECT 
  CASE 
    WHEN COUNT(*) = 1
    THEN '✅ PASS: Employee can see corrections to own entries'
    ELSE '❌ FAIL: Employee cannot see corrections to own entries'
  END as result
FROM timesheet_corrections;

-- Test 4.2: Employee cannot insert corrections
SELECT 'TEST 4.2: Employee cannot insert corrections' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

DO $$
BEGIN
  INSERT INTO timesheet_corrections (entry_id, admin_id, corrected_hours_decimal, note)
  SELECT 
    te.id,
    '22222222-2222-2222-2222-222222222222',
    7.0,
    'Employee correction attempt'
  FROM timesheet_entries te
  WHERE te.employee_id = '22222222-2222-2222-2222-222222222222'
  LIMIT 1;
  
  RAISE EXCEPTION '❌ FAIL: Employee was able to insert correction';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ PASS: Employee cannot insert corrections';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Unexpected error: %', SQLERRM;
END;
$$;

-- ===========================================
-- TEST 5: LEAVE REQUESTS RLS
-- ===========================================

-- Create test leave requests
INSERT INTO leave_requests (employee_id, type, period_start, period_end, comment, status)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'vacation', '2024-12-20', '2024-12-22', 'Holiday vacation', 'submitted'),
  ('33333333-3333-3333-3333-333333333333', 'day_off', '2024-12-25', '2024-12-25', 'Christmas day off', 'submitted');

-- Test 5.1: Employee can see only own leave requests
SELECT 'TEST 5.1: Employee sees only own leave requests' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND (SELECT employee_id FROM leave_requests LIMIT 1) = '22222222-2222-2222-2222-222222222222'
    THEN '✅ PASS: Employee sees only own leave requests'
    ELSE '❌ FAIL: Employee sees other leave requests'
  END as result
FROM leave_requests;

-- Test 5.2: Employee can update own submitted request
SELECT 'TEST 5.2: Employee can update own submitted request' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

DO $$
BEGIN
  UPDATE leave_requests 
  SET comment = 'Updated vacation request'
  WHERE employee_id = '22222222-2222-2222-2222-222222222222' 
  AND status = 'submitted';
  
  RAISE NOTICE '✅ PASS: Employee can update own submitted request';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Employee cannot update own submitted request: %', SQLERRM;
END;
$$;

-- ===========================================
-- TEST 6: INBOX EVENTS RLS
-- ===========================================

-- Create test inbox events
INSERT INTO inbox_events (kind, payload, is_read)
VALUES 
  ('leave_request_submitted', '{"reqId": "11111111-1111-1111-1111-111111111111", "employeeId": "22222222-2222-2222-2222-222222222222"}', false),
  ('day_off_request_submitted', '{"reqId": "22222222-2222-2222-2222-222222222222", "employeeId": "33333333-3333-3333-3333-333333333333"}', false);

-- Test 6.1: Employee cannot see inbox events
SELECT 'TEST 6.1: Employee cannot see inbox events' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

SELECT 
  CASE 
    WHEN COUNT(*) = 0
    THEN '✅ PASS: Employee cannot see inbox events'
    ELSE '❌ FAIL: Employee can see inbox events'
  END as result
FROM inbox_events;

-- Test 6.2: Admin can see inbox events
SELECT 'TEST 6.2: Admin can see inbox events' as test_name;

SELECT test_as_user('11111111-1111-1111-1111-111111111111');

SELECT 
  CASE 
    WHEN COUNT(*) = 2
    THEN '✅ PASS: Admin can see inbox events'
    ELSE '❌ FAIL: Admin cannot see inbox events'
  END as result
FROM inbox_events;

-- ===========================================
-- TEST 7: CONSTRAINT VALIDATION
-- ===========================================

-- Test 7.1: Time order constraint
SELECT 'TEST 7.1: Time order constraint' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

DO $$
BEGIN
  INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, hours_decimal, status, activity_note)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-12-16', '17:00', '09:00', 8.0, 'work', 'Invalid time order');
  
  RAISE EXCEPTION '❌ FAIL: Time order constraint not enforced';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ PASS: Time order constraint enforced';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Unexpected error: %', SQLERRM;
END;
$$;

-- Test 7.2: Work activity note required
SELECT 'TEST 7.2: Work activity note required' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

DO $$
BEGIN
  INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, hours_decimal, status, activity_note)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-12-16', '09:00', '17:00', 8.0, 'work', '');
  
  RAISE EXCEPTION '❌ FAIL: Work activity note constraint not enforced';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ PASS: Work activity note constraint enforced';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Unexpected error: %', SQLERRM;
END;
$$;

-- Test 7.3: Vacation/sick comment required
SELECT 'TEST 7.3: Vacation/sick comment required' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

DO $$
BEGIN
  INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, hours_decimal, status, comment)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-12-16', '09:00', '17:00', 8.0, 'vacation', '');
  
  RAISE EXCEPTION '❌ FAIL: Vacation comment constraint not enforced';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '✅ PASS: Vacation comment constraint enforced';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Unexpected error: %', SQLERRM;
END;
$$;

-- ===========================================
-- TEST 8: STORAGE POLICIES
-- ===========================================

-- Test 8.1: Admin can access forms-templates
SELECT 'TEST 8.1: Admin can access forms-templates' as test_name;

SELECT test_as_user('11111111-1111-1111-1111-111111111111');

SELECT 
  CASE 
    WHEN storage.is_admin() = true
    THEN '✅ PASS: Admin can access forms-templates'
    ELSE '❌ FAIL: Admin cannot access forms-templates'
  END as result;

-- Test 8.2: Employee cannot access other employee's uploads
SELECT 'TEST 8.2: Employee cannot access other employee uploads' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

SELECT 
  CASE 
    WHEN storage.is_owner_prefix('33333333-3333-3333-3333-333333333333/2024/12/test.pdf') = false
    THEN '✅ PASS: Employee cannot access other employee uploads'
    ELSE '❌ FAIL: Employee can access other employee uploads'
  END as result;

-- Test 8.3: Employee can access own uploads
SELECT 'TEST 8.3: Employee can access own uploads' as test_name;

SELECT test_as_user('22222222-2222-2222-2222-222222222222');

SELECT 
  CASE 
    WHEN storage.is_owner_prefix('22222222-2222-2222-2222-222222222222/2024/12/test.pdf') = true
    THEN '✅ PASS: Employee can access own uploads'
    ELSE '❌ FAIL: Employee cannot access own uploads'
  END as result;

-- ===========================================
-- CLEANUP
-- ===========================================

-- Reset auth context
SELECT reset_auth();

-- Clean up test data
DELETE FROM timesheet_corrections;
DELETE FROM timesheet_entries;
DELETE FROM leave_requests;
DELETE FROM inbox_events;
DELETE FROM timesheet_months;
DELETE FROM profiles WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Drop test functions
DROP FUNCTION IF EXISTS test_as_user(uuid);
DROP FUNCTION IF EXISTS reset_auth();

-- ===========================================
-- SUMMARY
-- ===========================================

SELECT '===========================================' as summary;
SELECT 'RLS AND CONSTRAINTS VERIFICATION COMPLETE' as summary;
SELECT '===========================================' as summary;
SELECT 'All tests should show ✅ PASS results above' as summary;
SELECT 'If any ❌ FAIL results, check RLS policies and constraints' as summary;
