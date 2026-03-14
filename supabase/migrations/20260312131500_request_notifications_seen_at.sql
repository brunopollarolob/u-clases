-- ============================================================
-- Notification read-state for class request updates
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS request_notifications_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing users so they don't get flooded by old notifications.
UPDATE users
SET request_notifications_seen_at = NOW()
WHERE request_notifications_seen_at IS NULL;
