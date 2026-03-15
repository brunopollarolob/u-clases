-- Add TA flag per tutor course
ALTER TABLE tutor_courses
  ADD COLUMN IF NOT EXISTS is_ta BOOLEAN NOT NULL DEFAULT false;
