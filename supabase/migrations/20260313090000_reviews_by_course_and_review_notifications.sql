-- ============================================================
-- Reviews by course + tutor review notifications
-- ============================================================

-- Track when each user last saw tutor review notifications.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS review_notifications_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE users
SET review_notifications_seen_at = NOW()
WHERE review_notifications_seen_at IS NULL;

-- Link reviews to the reviewed course so visibility can be scoped per offered course.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS course_id VARCHAR(10) REFERENCES courses(id) ON DELETE RESTRICT;

-- Backfill existing reviews using the most recent completed class request for that student+tutor pair.
WITH review_course_backfill AS (
  SELECT
    r.id AS review_id,
    cr.course_id
  FROM reviews r
  JOIN LATERAL (
    SELECT class_requests.course_id
    FROM class_requests
    WHERE class_requests.student_id = r.student_id
      AND class_requests.tutor_profile_id = r.tutor_id
      AND class_requests.status = 'completed'
    ORDER BY class_requests.completed_at DESC NULLS LAST, class_requests.created_at DESC
    LIMIT 1
  ) cr ON true
  WHERE r.course_id IS NULL
)
UPDATE reviews
SET course_id = review_course_backfill.course_id
FROM review_course_backfill
WHERE reviews.id = review_course_backfill.review_id;

-- Replace old uniqueness (one review per tutor) with one review per tutor+course.
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_tutor_id_student_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_tutor_student_course_key
  ON reviews(tutor_id, student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_reviews_tutor_course
  ON reviews(tutor_id, course_id);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON reviews(created_at);
