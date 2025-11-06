-- Tetrasan Time-Tracking App - Local Development Seed Data
-- Migration: 20241214_seed_local.sql
-- Description: Minimal seed data for local development and testing

-- ===========================================
-- SEED DATA FOR LOCAL DEVELOPMENT
-- ===========================================

-- Note: This seed data is for local development only
-- In production, profiles will be created via the invite-only signup flow
-- where profiles.id is updated to auth.uid() after user creation

-- ===========================================
-- ADMIN PROFILE
-- ===========================================

INSERT INTO profiles (id, email, full_name, role, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@tetrasan.de',
  'Admin User',
  'admin',
  true
);

-- ===========================================
-- EMPLOYEE PROFILES
-- ===========================================

INSERT INTO profiles (id, email, full_name, role, active)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'max@tetrasan.de',
    'Max Mustermann',
    'employee',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'anna@tetrasan.de',
    'Anna Schmidt',
    'employee',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'thomas@tetrasan.de',
    'Thomas Weber',
    'employee',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'julia@tetrasan.de',
    'Julia Müller',
    'employee',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'michael@tetrasan.de',
    'Michael Fischer',
    'employee',
    true
  );

-- ===========================================
-- TIMESHEET MONTHS (CURRENT MONTH - OPEN)
-- ===========================================

-- Create open timesheet months for current month for all employees
INSERT INTO timesheet_months (employee_id, year, month, status)
SELECT 
  id,
  EXTRACT(year FROM CURRENT_DATE)::int,
  EXTRACT(month FROM CURRENT_DATE)::int,
  'open'
FROM profiles 
WHERE role = 'employee' AND active = true;

-- ===========================================
-- SAMPLE TIMESHEET ENTRIES
-- ===========================================

-- Max Mustermann - Work entries
INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, break_minutes, hours_decimal, status, activity_note)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '3 days',
    '08:00',
    '16:30',
    30,
    8.0,
    'work',
    'Bauarbeiten am Hauptgebäude'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '2 days',
    '09:00',
    '17:00',
    60,
    7.0,
    'work',
    'Materiallieferung und Einlagerung'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '1 day',
    '08:30',
    '16:00',
    30,
    7.0,
    'work',
    'Wartungsarbeiten an Maschinen'
  );

-- Anna Schmidt - Mixed entries
INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, break_minutes, hours_decimal, status, activity_note, comment)
VALUES 
  (
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '3 days',
    '08:00',
    '16:00',
    30,
    7.5,
    'work',
    'Büroarbeiten und Planung',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '2 days',
    '00:00',
    '00:00',
    0,
    0.0,
    'sick',
    NULL,
    'Grippe - Arztbesuch'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00',
    '17:30',
    60,
    7.5,
    'work',
    'Kundenberatung und Angebote',
    NULL
  );

-- Thomas Weber - Work entries
INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, break_minutes, hours_decimal, status, activity_note)
VALUES 
  (
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE - INTERVAL '3 days',
    '07:30',
    '15:30',
    30,
    7.5,
    'work',
    'Frühschicht - Baustellenvorbereitung'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE - INTERVAL '2 days',
    '08:00',
    '16:00',
    30,
    7.5,
    'work',
    'Mauerarbeiten und Verputzen'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00',
    '17:00',
    60,
    7.0,
    'work',
    'Reinigung und Aufräumen'
  );

-- ===========================================
-- SAMPLE LEAVE REQUESTS
-- ===========================================

-- Max Mustermann - Vacation request
INSERT INTO leave_requests (employee_id, type, period_start, period_end, comment, status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'vacation',
    CURRENT_DATE + INTERVAL '1 week',
    CURRENT_DATE + INTERVAL '1 week' + INTERVAL '4 days',
    'Familienurlaub über Weihnachten',
    'submitted'
  );

-- Anna Schmidt - Day off request
INSERT INTO leave_requests (employee_id, type, period_start, period_end, comment, status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000003',
    'day_off',
    CURRENT_DATE + INTERVAL '2 weeks',
    CURRENT_DATE + INTERVAL '2 weeks',
    'Arzttermin - Vorsorgeuntersuchung',
    'submitted'
  );

-- Thomas Weber - Vacation request
INSERT INTO leave_requests (employee_id, type, period_start, period_end, comment, status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000004',
    'vacation',
    CURRENT_DATE + INTERVAL '3 weeks',
    CURRENT_DATE + INTERVAL '3 weeks' + INTERVAL '1 week',
    'Skiurlaub in den Alpen',
    'submitted'
  );

-- ===========================================
-- SAMPLE INBOX EVENTS
-- ===========================================

-- Create inbox events for the leave requests
INSERT INTO inbox_events (kind, payload, is_read, admin_id)
VALUES 
  (
    'leave_request_submitted',
    '{"reqId": "' || (SELECT id FROM leave_requests WHERE employee_id = '00000000-0000-0000-0000-000000000002' LIMIT 1) || '", "employeeId": "00000000-0000-0000-0000-000000000002"}',
    false,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'day_off_request_submitted',
    '{"reqId": "' || (SELECT id FROM leave_requests WHERE employee_id = '00000000-0000-0000-0000-000000000003' LIMIT 1) || '", "employeeId": "00000000-0000-0000-0000-000000000003"}',
    false,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'leave_request_submitted',
    '{"reqId": "' || (SELECT id FROM leave_requests WHERE employee_id = '00000000-0000-0000-0000-000000000004' LIMIT 1) || '", "employeeId": "00000000-0000-0000-0000-000000000004"}',
    true,
    '00000000-0000-0000-0000-000000000001'
  );

-- ===========================================
-- SAMPLE TIMESHEET CORRECTIONS
-- ===========================================

-- Create a correction for Max's timesheet entry (red block)
INSERT INTO timesheet_corrections (entry_id, admin_id, corrected_hours_decimal, note)
SELECT 
  te.id,
  '00000000-0000-0000-0000-000000000001',
  7.5,
  'Pause wurde nicht korrekt erfasst - 45 Minuten statt 30'
FROM timesheet_entries te
WHERE te.employee_id = '00000000-0000-0000-0000-000000000002'
AND te.date = CURRENT_DATE - INTERVAL '3 days'
LIMIT 1;

-- ===========================================
-- COMMENTS
-- ===========================================

-- Add comments to explain the seed data
COMMENT ON TABLE profiles IS 'Seed data: 1 admin + 5 employees for local development';
COMMENT ON TABLE timesheet_entries IS 'Seed data: Sample work, vacation, and sick entries';
COMMENT ON TABLE leave_requests IS 'Seed data: Sample vacation and day-off requests';
COMMENT ON TABLE inbox_events IS 'Seed data: Sample admin inbox notifications';
COMMENT ON TABLE timesheet_corrections IS 'Seed data: Sample admin correction (red block)';
COMMENT ON TABLE timesheet_months IS 'Seed data: Current month open for all employees';

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Verify seed data was inserted correctly
DO $$
DECLARE
  profile_count int;
  timesheet_count int;
  leave_count int;
  inbox_count int;
  correction_count int;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO timesheet_count FROM timesheet_entries;
  SELECT COUNT(*) INTO leave_count FROM leave_requests;
  SELECT COUNT(*) INTO inbox_count FROM inbox_events;
  SELECT COUNT(*) INTO correction_count FROM timesheet_corrections;
  
  -- Report results
  RAISE NOTICE 'Seed data verification:';
  RAISE NOTICE '- Profiles: % (1 admin + 5 employees)', profile_count;
  RAISE NOTICE '- Timesheet entries: %', timesheet_count;
  RAISE NOTICE '- Leave requests: %', leave_count;
  RAISE NOTICE '- Inbox events: %', inbox_count;
  RAISE NOTICE '- Timesheet corrections: %', correction_count;
  
  -- Verify counts
  IF profile_count = 6 AND timesheet_count >= 6 AND leave_count = 3 AND inbox_count = 3 AND correction_count = 1 THEN
    RAISE NOTICE '✅ All seed data inserted successfully!';
  ELSE
    RAISE NOTICE '❌ Seed data verification failed - check counts above';
  END IF;
END;
$$;
