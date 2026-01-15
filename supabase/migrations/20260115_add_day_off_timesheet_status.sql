-- Add "day_off" as a new timesheet status for Tagesbefreiung.
-- This allows storing day-off exemptions as separate entries that can coexist with work entries on the same date.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'day_off'
      AND enumtypid = 'timesheet_status_enum'::regtype
  ) THEN
    ALTER TYPE timesheet_status_enum ADD VALUE 'day_off';
  END IF;
END$$;


