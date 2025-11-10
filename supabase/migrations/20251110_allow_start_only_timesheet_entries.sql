-- Allow start-only work entries by relaxing time constraints and activity requirements

-- Drop strict time order constraint to allow missing end time
ALTER TABLE timesheet_entries
  DROP CONSTRAINT IF EXISTS timesheet_time_order;

-- Allow NULL end times
ALTER TABLE timesheet_entries
  ALTER COLUMN time_to DROP NOT NULL;

-- Re-introduce time order constraint permitting NULL end times
ALTER TABLE timesheet_entries
  ADD CONSTRAINT timesheet_time_order
  CHECK (time_to IS NULL OR time_to > time_from);

-- Update work activity constraint to permit start-only entries
ALTER TABLE timesheet_entries
  DROP CONSTRAINT IF EXISTS timesheet_work_activity_required;

ALTER TABLE timesheet_entries
  ADD CONSTRAINT timesheet_work_activity_required
  CHECK (
    status <> 'work'
    OR time_to IS NULL
    OR (
      COALESCE(TRIM(project_name), '') <> ''
      AND COALESCE(TRIM(activity_note), '') <> ''
    )
  );

