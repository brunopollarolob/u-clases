-- ============================================================
-- User specialization field for U-clases student/teacher profile
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS specialization TEXT;

CREATE INDEX IF NOT EXISTS idx_users_specialization ON users(specialization);
