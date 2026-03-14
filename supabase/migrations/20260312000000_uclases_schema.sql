-- ============================================================
-- U-clases: Esquema extendido para FCFM / Beauchef
-- Migración: 20260312000000_uclases_schema.sql
-- ============================================================

-- ============================================================
-- 1. EXTENDER LA TABLA USERS
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'tutor');

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- 2. TABLA COURSES (ramos fijos del Plan Común FCFM)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id      VARCHAR(10)  PRIMARY KEY,
  name    VARCHAR(100) NOT NULL
);

-- Insertar los ramos de Plan Común
INSERT INTO courses (id, name) VALUES
  ('MA1001', 'INTRODUCCIÓN AL CÁLCULO'),
  ('MA1101', 'INTRODUCCIÓN AL ÁLGEBRA'),
  ('FI1000', 'INTRODUCCIÓN A LA FÍSICA CLÁSICA'),
  ('MA1002', 'CÁLCULO DIFERENCIAL E INTEGRAL'),
  ('MA1102', 'ÁLGEBRA LINEAL'),
  ('FI1100', 'INTRODUCCIÓN A LA FÍSICA MODERNA'),
  ('MA2001', 'CÁLCULO EN VARIAS VARIABLES'),
  ('MA2601', 'ECUACIONES DIFERENCIALES ORDINARIAS'),
  ('FI2003', 'MÉTODOS EXPERIMENTALES'),
  ('FI2001', 'MECÁNICA'),
  ('IQ2211', 'QUÍMICA'),
  ('IN2201', 'ECONOMÍA'),
  ('MA2002', 'CÁLCULO AVANZADO Y APLICACIONES'),
  ('FI2002', 'ELECTROMAGNETISMO'),
  ('FI2004', 'TERMODINÁMICA'),
  ('IQ2212', 'TERMODINÁMICA QUÍMICA')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. TABLA TUTOR_PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_profiles (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio          TEXT,
  hourly_rate  INTEGER,        -- CLP por hora (opcional)
  contact_info VARCHAR(200),   -- email o WhatsApp
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. TABLA TUTOR_COURSES (relación tutor ↔ ramo)
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_courses (
  tutor_profile_id  INTEGER    NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  course_id         VARCHAR(10) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (tutor_profile_id, course_id)
);

-- ============================================================
-- 5. TABLA REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  tutor_id    INTEGER NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, student_id)  -- un alumno, una reseña por tutor
);

-- ============================================================
-- 6. TRIGGER: updated_at para tutor_profiles
-- ============================================================
CREATE TRIGGER update_tutor_profiles_updated_at
  BEFORE UPDATE ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id    ON tutor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_courses_course_id   ON tutor_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_id          ON reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id        ON reviews(student_id);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- COURSES: solo lectura pública (los ramos son datos de referencia)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cursos son de lectura pública" ON courses
  FOR SELECT USING (true);
CREATE POLICY "Solo service_role puede modificar cursos" ON courses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- TUTOR_PROFILES: lectura pública, escritura solo el dueño
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfiles de tutor son de lectura pública" ON tutor_profiles
  FOR SELECT USING (true);
CREATE POLICY "Tutor gestiona su propio perfil" ON tutor_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = tutor_profiles.user_id
        AND users.supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = tutor_profiles.user_id
        AND users.supabase_user_id = auth.uid()
    )
  );
CREATE POLICY "Service role acceso total a tutor_profiles" ON tutor_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- TUTOR_COURSES: lectura pública, escritura solo el tutor dueño
ALTER TABLE tutor_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutor-cursos son de lectura pública" ON tutor_courses
  FOR SELECT USING (true);
CREATE POLICY "Tutor gestiona sus propios cursos" ON tutor_courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.id = tutor_courses.tutor_profile_id
        AND u.supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.id = tutor_courses.tutor_profile_id
        AND u.supabase_user_id = auth.uid()
    )
  );
CREATE POLICY "Service role acceso total a tutor_courses" ON tutor_courses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- REVIEWS: lectura pública, solo estudiantes autenticados insertan
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reseñas son de lectura pública" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "Estudiantes autenticados pueden dejar reseña" ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = reviews.student_id
        AND users.supabase_user_id = auth.uid()
        AND users.role = 'student'
    )
  );
CREATE POLICY "Service role acceso total a reviews" ON reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 9. PERMISOS PARA ROL authenticated
-- ============================================================
GRANT SELECT ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tutor_profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON tutor_courses TO authenticated;
GRANT SELECT, INSERT ON reviews TO authenticated;
GRANT USAGE ON SEQUENCE tutor_profiles_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE reviews_id_seq TO authenticated;
