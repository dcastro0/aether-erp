DROP INDEX IF EXISTS idx_activity_logs_action;
DROP INDEX IF EXISTS idx_activity_logs_entity;
DROP INDEX IF EXISTS idx_activity_logs_user_id;

ALTER TABLE activity_logs
  DROP COLUMN IF EXISTS ip_address,
  DROP COLUMN IF EXISTS details,
  DROP COLUMN IF EXISTS entity_id,
  DROP COLUMN IF EXISTS entity,
  DROP COLUMN IF EXISTS user_email,
  DROP COLUMN IF EXISTS user_id;
