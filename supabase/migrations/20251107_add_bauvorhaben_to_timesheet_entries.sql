-- Add Bauvorhaben field to timesheet entries
ALTER TABLE timesheet_entries
  ADD COLUMN IF NOT EXISTS project_name TEXT;

COMMENT ON COLUMN timesheet_entries.project_name IS 'Name des Bauvorhabens / Projekts';

