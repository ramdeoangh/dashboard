-- Run on existing DBs after 001. Greenfield: use full schema.sql instead.

CREATE TABLE IF NOT EXISTS project_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  UNIQUE KEY uk_project_categories_slug (slug),
  CONSTRAINT fk_pc_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_pc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO project_categories (name, slug, status) VALUES ('General', 'general', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

ALTER TABLE projects
  MODIFY procurement_name VARCHAR(255) NOT NULL DEFAULT '';

SET @cat_id = (SELECT id FROM project_categories WHERE slug = 'general' LIMIT 1);

ALTER TABLE projects
  ADD COLUMN category_id INT UNSIGNED NULL AFTER location_id;

UPDATE projects SET category_id = @cat_id WHERE category_id IS NULL;

ALTER TABLE projects
  MODIFY category_id INT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_projects_category FOREIGN KEY (category_id) REFERENCES project_categories (id),
  ADD KEY idx_projects_category (category_id);

CREATE TABLE IF NOT EXISTS project_photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  kind VARCHAR(16) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  KEY idx_pp_project_kind (project_id, kind, sort_order),
  CONSTRAINT fk_pp_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_pp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_pp_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (name, slug, resource, action) VALUES
  ('Categories view', 'categories.view', 'categories', 'view'),
  ('Categories edit', 'categories.edit', 'categories', 'edit')
ON DUPLICATE KEY UPDATE name = VALUES(name), resource = VALUES(resource), action = VALUES(action);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'super_admin' AND p.slug IN ('categories.view', 'categories.edit')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'admin' AND p.slug IN ('categories.view', 'categories.edit')
ON DUPLICATE KEY UPDATE role_id = role_id;
