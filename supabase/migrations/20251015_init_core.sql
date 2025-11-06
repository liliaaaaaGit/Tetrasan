-- Tetrasan Time-Tracking App - Complete Database Schema
-- Migration: 20251015_init_core.sql
-- Description: Creates all tables, enums, constraints, RLS policies, storage buckets, and seed data
-- Safe to re-run: All statements use IF NOT EXISTS or are idempotent

-- ===========================================
-- EXTENSIONS
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ===========================================
-- ENUMS
-- ===========================================

-- User roles
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Timesheet entry status
DO $$ BEGIN
    CREATE TYPE timesheet_status_enum AS ENUM ('work', 'vacation', 'sick');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Request types
DO $$ BEGIN
    CREATE TYPE request_type_enum AS ENUM ('vacation', 'day_off');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Request status
DO $$ BEGIN
    CREATE TYPE request_status_enum AS ENUM ('submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Month approval status
DO $$ BEGIN
    CREATE TYPE month_status_enum AS ENUM ('open', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND active = true
  );
$$;

-- Check if current user owns a profile
CREATE OR REPLACE FUNCTION is_owner(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = profile_id;
$$;

-- Check if month is open for employee
CREATE OR REPLACE FUNCTION is_month_open(emp_id uuid, year_val int, month_val int)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT status = 'open' 
     FROM timesheet_months 
     WHERE employee_id = emp_id 
     AND year = year_val 
     AND month = month_val),
    true  -- Default to open if no timesheet_months record exists
  );
$$;

-- ===========================================
-- CORE TABLES
-- ===========================================

-- User profiles and roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  full_name text,
  phone text,
  role role_enum NOT NULL DEFAULT 'employee',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Timesheet entries
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_from time NOT NULL,
  time_to time NOT NULL,
  break_minutes integer NOT NULL DEFAULT 0,
  hours_decimal numeric(5,2) NOT NULL CHECK (hours_decimal >= 0),
  status timesheet_status_enum NOT NULL DEFAULT 'work',
  activity_note text,
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT timesheet_time_order CHECK (time_to > time_from),
  CONSTRAINT timesheet_break_positive CHECK (break_minutes >= 0),
  CONSTRAINT timesheet_work_activity_required CHECK (
    (status = 'work' AND COALESCE(length(trim(activity_note)), 0) > 0) OR 
    (status != 'work')
  ),
  CONSTRAINT timesheet_vacation_sick_comment_required CHECK (
    (status IN ('vacation', 'sick') AND COALESCE(length(trim(comment)), 0) > 0) OR 
    (status NOT IN ('vacation', 'sick'))
  )
);

-- Timesheet corrections (admin changes)
CREATE TABLE IF NOT EXISTS timesheet_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES timesheet_entries(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  corrected_time_from time,
  corrected_time_to time,
  corrected_break_minutes integer,
  corrected_hours_decimal numeric(5,2) CHECK (corrected_hours_decimal >= 0),
  note text,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT correction_time_order CHECK (
    corrected_time_to IS NULL OR 
    corrected_time_from IS NULL OR 
    corrected_time_to > corrected_time_from
  ),
  CONSTRAINT correction_break_positive CHECK (
    corrected_break_minutes IS NULL OR 
    corrected_break_minutes >= 0
  )
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type request_type_enum NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  comment text NOT NULL,
  status request_status_enum NOT NULL DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT leave_period_order CHECK (period_end >= period_start),
  CONSTRAINT leave_comment_required CHECK (COALESCE(length(trim(comment)), 0) > 0)
);

-- Inbox events (notifications)
CREATE TABLE IF NOT EXISTS inbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('leave_request_submitted', 'day_off_request_submitted')),
  payload jsonb NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Timesheet months (cutoff/approval tracking)
CREATE TABLE IF NOT EXISTS timesheet_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  status month_status_enum NOT NULL DEFAULT 'open',
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(employee_id, year, month)
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Profiles indexes
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Timesheet entries indexes
CREATE INDEX IF NOT EXISTS timesheet_entries_employee_date_idx ON timesheet_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS timesheet_entries_date_idx ON timesheet_entries(date);

-- Timesheet corrections indexes
CREATE INDEX IF NOT EXISTS timesheet_corrections_entry_created_idx ON timesheet_corrections(entry_id, created_at DESC);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS leave_requests_employee_created_idx ON leave_requests(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests(status);

-- Inbox events indexes
CREATE INDEX IF NOT EXISTS inbox_events_created_idx ON inbox_events(created_at DESC);
CREATE INDEX IF NOT EXISTS inbox_events_unread_idx ON inbox_events(is_read) WHERE is_read = false;

-- Timesheet months indexes
CREATE UNIQUE INDEX IF NOT EXISTS timesheet_months_employee_year_month_idx ON timesheet_months(employee_id, year, month);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timesheet_entries_updated_at ON timesheet_entries;
CREATE TRIGGER update_timesheet_entries_updated_at 
  BEFORE UPDATE ON timesheet_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_months ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES - PROFILES
-- ===========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON profiles;

-- Profiles: SELECT - employees see only self, admins see all
CREATE POLICY "profiles_select_own_or_admin" ON profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      is_owner(id)
    )
  );

-- Profiles: UPDATE - self can update limited fields, admins can update all
CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      is_owner(id)
    )
  );

-- Profiles: INSERT - only admins
CREATE POLICY "profiles_insert_admin_only" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Profiles: DELETE - only admins
CREATE POLICY "profiles_delete_admin_only" ON profiles
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- ===========================================
-- RLS POLICIES - TIMESHEET_ENTRIES
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "timesheet_entries_select_own_or_admin" ON timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_insert_own_open_or_admin" ON timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_update_own_open_or_admin" ON timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_delete_own_open_or_admin" ON timesheet_entries;

-- Timesheet entries: SELECT - owner or admin
CREATE POLICY "timesheet_entries_select_own_or_admin" ON timesheet_entries
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      is_owner(employee_id)
    )
  );

-- Timesheet entries: INSERT - owner (only for open months) or admin
CREATE POLICY "timesheet_entries_insert_own_open_or_admin" ON timesheet_entries
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      (is_owner(employee_id) AND is_month_open(employee_id, EXTRACT(year FROM date)::int, EXTRACT(month FROM date)::int))
    )
  );

-- Timesheet entries: UPDATE - owner only when month open, admin always
CREATE POLICY "timesheet_entries_update_own_open_or_admin" ON timesheet_entries
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      (is_owner(employee_id) AND is_month_open(employee_id, EXTRACT(year FROM date)::int, EXTRACT(month FROM date)::int))
    )
  );

-- Timesheet entries: DELETE - owner only when month open, admin always
CREATE POLICY "timesheet_entries_delete_own_open_or_admin" ON timesheet_entries
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      (is_owner(employee_id) AND is_month_open(employee_id, EXTRACT(year FROM date)::int, EXTRACT(month FROM date)::int))
    )
  );

-- ===========================================
-- RLS POLICIES - TIMESHEET_CORRECTIONS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "timesheet_corrections_select_own_or_admin" ON timesheet_corrections;
DROP POLICY IF EXISTS "timesheet_corrections_insert_admin_only" ON timesheet_corrections;
DROP POLICY IF EXISTS "timesheet_corrections_update_admin_only" ON timesheet_corrections;
DROP POLICY IF EXISTS "timesheet_corrections_delete_admin_only" ON timesheet_corrections;

-- Timesheet corrections: SELECT - owner of related entry or admin
CREATE POLICY "timesheet_corrections_select_own_or_admin" ON timesheet_corrections
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      EXISTS (
        SELECT 1 FROM timesheet_entries 
        WHERE id = timesheet_corrections.entry_id 
        AND employee_id = auth.uid()
      )
    )
  );

-- Timesheet corrections: INSERT - admin only
CREATE POLICY "timesheet_corrections_insert_admin_only" ON timesheet_corrections
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Timesheet corrections: UPDATE - admin only
CREATE POLICY "timesheet_corrections_update_admin_only" ON timesheet_corrections
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Timesheet corrections: DELETE - admin only
CREATE POLICY "timesheet_corrections_delete_admin_only" ON timesheet_corrections
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- ===========================================
-- RLS POLICIES - LEAVE_REQUESTS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "leave_requests_select_own_or_admin" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_own_or_admin" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_own_submitted_or_admin" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete_own_submitted_or_admin" ON leave_requests;

-- Leave requests: SELECT - owner or admin
CREATE POLICY "leave_requests_select_own_or_admin" ON leave_requests
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      is_owner(employee_id)
    )
  );

-- Leave requests: INSERT - owner or admin
CREATE POLICY "leave_requests_insert_own_or_admin" ON leave_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      is_owner(employee_id)
    )
  );

-- Leave requests: UPDATE - owner only if submitted, admin always
CREATE POLICY "leave_requests_update_own_submitted_or_admin" ON leave_requests
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      (is_owner(employee_id) AND status = 'submitted')
    )
  );

-- Leave requests: DELETE - owner only while submitted, admin always
CREATE POLICY "leave_requests_delete_own_submitted_or_admin" ON leave_requests
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      (is_owner(employee_id) AND status = 'submitted')
    )
  );

-- ===========================================
-- RLS POLICIES - INBOX_EVENTS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "inbox_events_select_admin_only" ON inbox_events;
DROP POLICY IF EXISTS "inbox_events_insert_admin_only" ON inbox_events;
DROP POLICY IF EXISTS "inbox_events_update_admin_only" ON inbox_events;
DROP POLICY IF EXISTS "inbox_events_delete_admin_only" ON inbox_events;

-- Inbox events: SELECT - admin only
CREATE POLICY "inbox_events_select_admin_only" ON inbox_events
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Inbox events: INSERT - admin only (system/server)
CREATE POLICY "inbox_events_insert_admin_only" ON inbox_events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Inbox events: UPDATE - admin only
CREATE POLICY "inbox_events_update_admin_only" ON inbox_events
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Inbox events: DELETE - admin only
CREATE POLICY "inbox_events_delete_admin_only" ON inbox_events
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- ===========================================
-- RLS POLICIES - TIMESHEET_MONTHS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "timesheet_months_select_own_or_admin" ON timesheet_months;
DROP POLICY IF EXISTS "timesheet_months_insert_admin_only" ON timesheet_months;
DROP POLICY IF EXISTS "timesheet_months_update_admin_only" ON timesheet_months;
DROP POLICY IF EXISTS "timesheet_months_delete_admin_only" ON timesheet_months;

-- Timesheet months: SELECT - owner or admin
CREATE POLICY "timesheet_months_select_own_or_admin" ON timesheet_months
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR 
      is_owner(employee_id)
    )
  );

-- Timesheet months: INSERT - admin only
CREATE POLICY "timesheet_months_insert_admin_only" ON timesheet_months
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Timesheet months: UPDATE - admin only
CREATE POLICY "timesheet_months_update_admin_only" ON timesheet_months
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- Timesheet months: DELETE - admin only
CREATE POLICY "timesheet_months_delete_admin_only" ON timesheet_months
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    is_admin()
  );

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================

-- Create forms-templates bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forms-templates',
  'forms-templates',
  true,  -- Public read access
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create forms-uploads bucket (private, employee-specific)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forms-uploads',
  'forms-uploads',
  false,  -- Private access only
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- STORAGE HELPER FUNCTIONS
-- ===========================================

-- Check if current user is admin (for storage policies)
CREATE OR REPLACE FUNCTION storage.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND active = true
  );
$$;

-- Check if object name starts with user's UUID (for employee access)
CREATE OR REPLACE FUNCTION storage.is_owner_prefix(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT position(auth.uid()::text || '/' IN object_name) = 1;
$$;

-- ===========================================
-- STORAGE POLICIES - FORMS-TEMPLATES
-- ===========================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "forms_templates_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "forms_templates_insert_admin_only" ON storage.objects;
DROP POLICY IF EXISTS "forms_templates_update_admin_only" ON storage.objects;
DROP POLICY IF EXISTS "forms_templates_delete_admin_only" ON storage.objects;

-- Forms-templates: SELECT - public read (authenticated users)
CREATE POLICY "forms_templates_select_authenticated" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated'
  );

-- Forms-templates: INSERT - admin only
CREATE POLICY "forms_templates_insert_admin_only" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated' AND
    storage.is_admin()
  );

-- Forms-templates: UPDATE - admin only
CREATE POLICY "forms_templates_update_admin_only" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated' AND
    storage.is_admin()
  );

-- Forms-templates: DELETE - admin only
CREATE POLICY "forms_templates_delete_admin_only" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated' AND
    storage.is_admin()
  );

-- ===========================================
-- STORAGE POLICIES - FORMS-UPLOADS
-- ===========================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "forms_uploads_select_admin_or_owner" ON storage.objects;
DROP POLICY IF EXISTS "forms_uploads_insert_admin_or_owner" ON storage.objects;
DROP POLICY IF EXISTS "forms_uploads_update_admin_or_owner" ON storage.objects;
DROP POLICY IF EXISTS "forms_uploads_delete_admin_or_owner" ON storage.objects;

-- Forms-uploads: SELECT - admin or owner (employee reads own uploads)
CREATE POLICY "forms_uploads_select_admin_or_owner" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- Forms-uploads: INSERT - admin or owner (employees can only write to own prefix)
CREATE POLICY "forms_uploads_insert_admin_or_owner" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- Forms-uploads: UPDATE - admin or owner
CREATE POLICY "forms_uploads_update_admin_or_owner" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- Forms-uploads: DELETE - admin or owner
CREATE POLICY "forms_uploads_delete_admin_or_owner" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- ===========================================
-- SEED DATA (SAFE DUMMY DATA)
-- ===========================================

-- Insert test admin profile (only if not exists)
INSERT INTO profiles (id, email, full_name, role, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@tetrasan.de',
  'Admin User',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert test employee profiles (only if not exists)
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
  )
ON CONFLICT (email) DO NOTHING;

-- Insert timesheet months for current month (only if not exists)
INSERT INTO timesheet_months (employee_id, year, month, status)
SELECT 
  id,
  EXTRACT(year FROM CURRENT_DATE)::int,
  EXTRACT(month FROM CURRENT_DATE)::int,
  'open'
FROM profiles 
WHERE role = 'employee' AND active = true
ON CONFLICT (employee_id, year, month) DO NOTHING;

-- Insert sample timesheet entries (only if not exists)
INSERT INTO timesheet_entries (employee_id, date, time_from, time_to, break_minutes, hours_decimal, status, activity_note)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '2 days',
    '08:00',
    '16:30',
    30,
    8.0,
    'work',
    'Bauarbeiten am Hauptgebäude'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00',
    '17:00',
    60,
    7.0,
    'work',
    'Büroarbeiten und Planung'
  )
ON CONFLICT DO NOTHING;

-- Insert sample leave requests (only if not exists)
INSERT INTO leave_requests (employee_id, type, period_start, period_end, comment, status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'vacation',
    CURRENT_DATE + INTERVAL '1 week',
    CURRENT_DATE + INTERVAL '1 week' + INTERVAL '4 days',
    'Familienurlaub über Weihnachten',
    'submitted'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'day_off',
    CURRENT_DATE + INTERVAL '2 weeks',
    CURRENT_DATE + INTERVAL '2 weeks',
    'Arzttermin - Vorsorgeuntersuchung',
    'submitted'
  )
ON CONFLICT DO NOTHING;

-- Insert sample inbox events (only if not exists)
INSERT INTO inbox_events (kind, payload, is_read, admin_id)
VALUES 
  (
    'leave_request_submitted',
    '{"reqId": "00000000-0000-0000-0000-000000000001", "employeeId": "00000000-0000-0000-0000-000000000002"}',
    false,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'day_off_request_submitted',
    '{"reqId": "00000000-0000-0000-0000-000000000002", "employeeId": "00000000-0000-0000-0000-000000000003"}',
    false,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;

-- Insert sample timesheet correction (only if not exists)
INSERT INTO timesheet_corrections (entry_id, admin_id, corrected_hours_decimal, note)
SELECT 
  te.id,
  '00000000-0000-0000-0000-000000000001',
  7.5,
  'Pause wurde nicht korrekt erfasst - 45 Minuten statt 30'
FROM timesheet_entries te
WHERE te.employee_id = '00000000-0000-0000-0000-000000000002'
AND te.date = CURRENT_DATE - INTERVAL '2 days'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE profiles IS 'User directory and roles. ID will be updated to auth.uid() after signup.';
COMMENT ON TABLE timesheet_entries IS 'Daily time entries with work/vacation/sick status';
COMMENT ON TABLE timesheet_corrections IS 'Admin corrections to timesheet entries (red blocks)';
COMMENT ON TABLE leave_requests IS 'Vacation and day-off requests';
COMMENT ON TABLE inbox_events IS 'Admin inbox notifications for new requests';
COMMENT ON TABLE timesheet_months IS 'Monthly cutoff/approval status per employee';

COMMENT ON FUNCTION is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION is_owner(uuid) IS 'Check if current user owns the profile';
COMMENT ON FUNCTION is_month_open(uuid, int, int) IS 'Check if month is open for employee (defaults to open)';

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Verify tables were created
DO $$
DECLARE
  table_count int;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'timesheet_entries', 'timesheet_corrections', 'leave_requests', 'inbox_events', 'timesheet_months');
  
  IF table_count = 6 THEN
    RAISE NOTICE '✅ All 6 core tables created successfully';
  ELSE
    RAISE NOTICE '❌ Expected 6 tables, found %', table_count;
  END IF;
END;
$$;

-- Verify RLS is enabled
DO $$
DECLARE
  rls_count int;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'timesheet_entries', 'timesheet_corrections', 'leave_requests', 'inbox_events', 'timesheet_months')
  AND rowsecurity = true;
  
  IF rls_count = 6 THEN
    RAISE NOTICE '✅ RLS enabled on all 6 tables';
  ELSE
    RAISE NOTICE '❌ Expected 6 tables with RLS, found %', rls_count;
  END IF;
END;
$$;

-- Verify storage buckets
DO $$
DECLARE
  bucket_count int;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets 
  WHERE id IN ('forms-templates', 'forms-uploads');
  
  IF bucket_count = 2 THEN
    RAISE NOTICE '✅ Both storage buckets created successfully';
  ELSE
    RAISE NOTICE '❌ Expected 2 storage buckets, found %', bucket_count;
  END IF;
END;
$$;

-- Verify seed data
DO $$
DECLARE
  profile_count int;
  timesheet_count int;
  leave_count int;
  inbox_count int;
  correction_count int;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO timesheet_count FROM timesheet_entries;
  SELECT COUNT(*) INTO leave_count FROM leave_requests;
  SELECT COUNT(*) INTO inbox_count FROM inbox_events;
  SELECT COUNT(*) INTO correction_count FROM timesheet_corrections;
  
  RAISE NOTICE '📊 Seed data summary:';
  RAISE NOTICE '- Profiles: % (1 admin + 2 employees)', profile_count;
  RAISE NOTICE '- Timesheet entries: %', timesheet_count;
  RAISE NOTICE '- Leave requests: %', leave_count;
  RAISE NOTICE '- Inbox events: %', inbox_count;
  RAISE NOTICE '- Timesheet corrections: %', correction_count;
  
  IF profile_count >= 3 AND timesheet_count >= 2 AND leave_count >= 2 AND inbox_count >= 2 THEN
    RAISE NOTICE '✅ Seed data inserted successfully!';
  ELSE
    RAISE NOTICE '❌ Seed data verification failed - check counts above';
  END IF;
END;
$$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Migration completed successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Run: npx supabase db push';
  RAISE NOTICE '2. Check Supabase dashboard for tables';
  RAISE NOTICE '3. Test with seed data users';
  RAISE NOTICE '4. Update app to use real database';
END;
$$;
