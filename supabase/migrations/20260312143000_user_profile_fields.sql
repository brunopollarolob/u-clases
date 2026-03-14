-- ============================================================
-- User profile fields for U-clases
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS academic_year INTEGER,
  ADD COLUMN IF NOT EXISTS is_graduated BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_academic_year ON users(academic_year);
CREATE INDEX IF NOT EXISTS idx_users_is_graduated ON users(is_graduated);
