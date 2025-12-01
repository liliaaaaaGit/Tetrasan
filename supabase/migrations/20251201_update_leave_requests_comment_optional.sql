-- Make leave_requests.comment optional so vacation requests don't require a reason.

ALTER TABLE leave_requests
ALTER COLUMN comment DROP NOT NULL;

ALTER TABLE leave_requests
DROP CONSTRAINT IF EXISTS leave_comment_required;


