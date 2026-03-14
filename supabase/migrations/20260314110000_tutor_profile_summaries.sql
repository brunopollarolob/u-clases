-- ============================================================
-- Tutor profile summaries (short + detailed)
-- ============================================================

ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS summary_short VARCHAR(220),
  ADD COLUMN IF NOT EXISTS summary_long TEXT;

-- Backfill from existing bio so old profiles keep meaningful content.
UPDATE tutor_profiles
SET
  summary_long = COALESCE(summary_long, bio),
  summary_short = COALESCE(summary_short, LEFT(COALESCE(bio, ''), 220))
WHERE summary_long IS NULL OR summary_short IS NULL;
