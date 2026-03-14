-- ============================================================
-- Tutor class pricing by duration
-- ============================================================

ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS class_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS class_price INTEGER;

-- Backfill sensible defaults from existing hourly_rate data.
UPDATE tutor_profiles
SET
  class_duration_minutes = COALESCE(class_duration_minutes, 60),
  class_price = COALESCE(class_price, hourly_rate)
WHERE class_duration_minutes IS NULL OR class_price IS NULL;

ALTER TABLE tutor_profiles
  ALTER COLUMN class_duration_minutes SET DEFAULT 60;
