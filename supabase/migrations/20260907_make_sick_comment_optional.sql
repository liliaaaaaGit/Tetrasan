-- Make sick-day comments optional.
-- Employees can save a Krank entry without a reason; admins still see a comment if one is entered.

ALTER TABLE timesheet_entries
DROP CONSTRAINT IF EXISTS timesheet_vacation_sick_comment_required;
