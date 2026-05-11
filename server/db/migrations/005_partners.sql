-- Partners: scope users and projects by partner (idempotent)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS partners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  UNIQUE KEY uk_partners_slug (slug),
  KEY idx_partners_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO partners (name, slug, is_active)
SELECT 'Default', 'default', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE slug = 'default' LIMIT 1);

SET @db := DATABASE();

-- users.partner_id
SET @pre := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'partner_id') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN partner_id INT UNSIGNED NULL COMMENT ''NULL = global admin'' AFTER display_name, ADD KEY idx_users_partner (partner_id)'
  )
);
PREPARE s1 FROM @pre; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @pre := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_partner') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT fk_users_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE RESTRICT'
  )
);
PREPARE s2 FROM @pre; EXECUTE s2; DEALLOCATE PREPARE s2;

-- projects.partner_id (nullable first, backfill, then NOT NULL + FK)
SET @pre := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'partner_id') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN partner_id INT UNSIGNED NULL AFTER location_id, ADD KEY idx_projects_partner (partner_id)'
  )
);
PREPARE s3 FROM @pre; EXECUTE s3; DEALLOCATE PREPARE s3;

UPDATE projects p
INNER JOIN partners pt ON pt.slug = 'default'
SET p.partner_id = pt.id
WHERE p.partner_id IS NULL;

SET @pre := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'partner_id'
       AND IS_NULLABLE = 'YES') = 0,
    'SELECT 1',
    'ALTER TABLE projects MODIFY COLUMN partner_id INT UNSIGNED NOT NULL'
  )
);
PREPARE s4 FROM @pre; EXECUTE s4; DEALLOCATE PREPARE s4;

SET @pre := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND CONSTRAINT_NAME = 'fk_projects_partner') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD CONSTRAINT fk_projects_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE RESTRICT'
  )
);
PREPARE s5 FROM @pre; EXECUTE s5; DEALLOCATE PREPARE s5;
