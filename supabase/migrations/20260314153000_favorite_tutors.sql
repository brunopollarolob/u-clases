-- ============================================================
-- U-clases: Favoritos de tutores por estudiante
-- Migración: 20260314153000_favorite_tutors.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS favorite_tutors (
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, tutor_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_tutors_student_id
  ON favorite_tutors(student_id);

CREATE INDEX IF NOT EXISTS idx_favorite_tutors_tutor_profile_id
  ON favorite_tutors(tutor_profile_id);

ALTER TABLE favorite_tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estudiantes leen sus favoritos" ON favorite_tutors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = favorite_tutors.student_id
        AND users.supabase_user_id = auth.uid()
        AND users.role = 'student'
    )
  );

CREATE POLICY "Estudiantes crean sus favoritos" ON favorite_tutors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = favorite_tutors.student_id
        AND users.supabase_user_id = auth.uid()
        AND users.role = 'student'
    )
  );

CREATE POLICY "Estudiantes eliminan sus favoritos" ON favorite_tutors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = favorite_tutors.student_id
        AND users.supabase_user_id = auth.uid()
        AND users.role = 'student'
    )
  );

CREATE POLICY "Service role acceso total a favorite_tutors" ON favorite_tutors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, DELETE ON favorite_tutors TO authenticated;
