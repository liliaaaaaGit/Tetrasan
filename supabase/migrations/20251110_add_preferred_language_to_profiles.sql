-- Add preferred language column to profiles for per-user localization

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'de';

-- Ensure existing rows have the default language set
UPDATE profiles
SET preferred_language = 'de'
WHERE preferred_language IS NULL;

COMMENT ON COLUMN profiles.preferred_language IS 'Preferred interface language (ISO code)';

