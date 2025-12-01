-- Relax vacation/sick comment requirement:
-- Only sick days must have a comment; vacation days can have an empty comment.

ALTER TABLE timesheet_entries
DROP CONSTRAINT IF EXISTS timesheet_vacation_sick_comment_required;

ALTER TABLE timesheet_entries
ADD CONSTRAINT timesheet_vacation_sick_comment_required CHECK (
  -- Sick days require a non-empty trimmed comment
  (status = 'sick' AND COALESCE(length(trim(comment)), 0) > 0)
  -- All other statuses (including vacation) have no comment requirement
  OR (status <> 'sick')
);


