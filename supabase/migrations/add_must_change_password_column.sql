-- Add must_change_password column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Ensure existing rows get default value
UPDATE profiles
SET must_change_password = COALESCE(must_change_password, false)
WHERE must_change_password IS NULL;

-- Optional comment for documentation
COMMENT ON COLUMN profiles.must_change_password IS 'Forces user to change password on next login when true.';

