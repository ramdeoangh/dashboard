-- Partner logo (idempotent)
SET NAMES utf8mb4;

SET @db := DATABASE();

SET @pre := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'partners' AND COLUMN_NAME = 'logo_path') > 0,
    'SELECT 1',
    'ALTER TABLE partners ADD COLUMN logo_path VARCHAR(500) NULL AFTER slug'
  )
);
PREPARE s FROM @pre; EXECUTE s; DEALLOCATE PREPARE s;
