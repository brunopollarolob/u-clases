-- ============================================================
-- Solicitudes de clase para verificar clases realizadas
-- ============================================================

CREATE TABLE IF NOT EXISTS class_requests (
  id SERIAL PRIMARY KEY,
  tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(10) NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  student_note TEXT,
  tutor_response TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_requests_tutor_profile_id ON class_requests(tutor_profile_id);
CREATE INDEX IF NOT EXISTS idx_class_requests_student_id ON class_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_class_requests_status ON class_requests(status);

CREATE TRIGGER update_class_requests_updated_at
  BEFORE UPDATE ON class_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE class_requests ENABLE ROW LEVEL SECURITY;

-- Alumno: ver sus solicitudes
CREATE POLICY "Students can view own class requests" ON class_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = class_requests.student_id
        AND u.supabase_user_id = auth.uid()
    )
  );

-- Alumno: crear solicitud propia
CREATE POLICY "Students can create own class requests" ON class_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = class_requests.student_id
        AND u.supabase_user_id = auth.uid()
        AND u.role = 'student'
    )
  );

-- Alumno: cancelar solicitud pendiente/aceptada propia
CREATE POLICY "Students can update own class requests" ON class_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = class_requests.student_id
        AND u.supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = class_requests.student_id
        AND u.supabase_user_id = auth.uid()
    )
  );

-- Profesor: ver solicitudes de su perfil
CREATE POLICY "Tutors can view class requests for their profile" ON class_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.id = class_requests.tutor_profile_id
        AND u.supabase_user_id = auth.uid()
    )
  );

-- Profesor: actualizar estado de solicitudes de su perfil
CREATE POLICY "Tutors can update class requests for their profile" ON class_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.id = class_requests.tutor_profile_id
        AND u.supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.id = class_requests.tutor_profile_id
        AND u.supabase_user_id = auth.uid()
    )
  );

-- Service role: acceso total
CREATE POLICY "Service role full access class requests" ON class_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON class_requests TO authenticated;
GRANT ALL ON class_requests TO service_role;
GRANT USAGE ON SEQUENCE class_requests_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE class_requests_id_seq TO service_role;
