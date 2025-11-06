-- Tetrasan Time-Tracking App - Core Database Schema
-- Migration: 20241214_init_core.sql
-- Description: Creates all core tables, enums, constraints, RLS policies, and triggers

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
CREATE TYPE role_enum AS ENUM ('admin', 'employee');

-- Timesheet entry status
CREATE TYPE timesheet_status_enum AS ENUM ('work', 'vacation', 'sick');

-- Request types
CREATE TYPE request_type_enum AS ENUM ('vacation', 'day_off');

-- Request status
CREATE TYPE request_status_enum AS ENUM ('submitted', 'approved', 'rejected');

-- Month approval status
CREATE TYPE month_status_enum AS ENUM ('open', 'approved');

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
CREATE TABLE profiles (
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
CREATE TABLE timesheet_entries (
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
CREATE TABLE timesheet_corrections (
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
CREATE TABLE leave_requests (
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
CREATE TABLE inbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('leave_request_submitted', 'day_off_request_submitted')),
  payload jsonb NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Timesheet months (cutoff/approval tracking)
CREATE TABLE timesheet_months (
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
CREATE UNIQUE INDEX profiles_email_idx ON profiles(email);

-- Timesheet entries indexes
CREATE INDEX timesheet_entries_employee_date_idx ON timesheet_entries(employee_id, date);
CREATE INDEX timesheet_entries_date_idx ON timesheet_entries(date);

-- Timesheet corrections indexes
CREATE INDEX timesheet_corrections_entry_created_idx ON timesheet_corrections(entry_id, created_at DESC);

-- Leave requests indexes
CREATE INDEX leave_requests_employee_created_idx ON leave_requests(employee_id, created_at DESC);
CREATE INDEX leave_requests_status_idx ON leave_requests(status);

-- Inbox events indexes
CREATE INDEX inbox_events_created_idx ON inbox_events(created_at DESC);
CREATE INDEX inbox_events_unread_idx ON inbox_events(is_read) WHERE is_read = false;

-- Timesheet months indexes
CREATE UNIQUE INDEX timesheet_months_employee_year_month_idx ON timesheet_months(employee_id, year, month);

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

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
