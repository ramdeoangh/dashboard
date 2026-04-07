-- Incremental migration for existing databases (run manually if not using full schema.sql reset).
-- Safe to run once; check for duplicate column errors.

ALTER TABLE users
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE roles
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER description,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE permissions
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER action,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_perms_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_perms_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE menus
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_menus_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_menus_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE submenus
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_sub_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_sub_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE settings
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER setting_value,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_settings_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE pages
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_pages_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_pages_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE states
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_states_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_states_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE locations
  ADD COLUMN created_by INT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_loc_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_loc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE projects
  ADD COLUMN beneficiary_details TEXT NULL AFTER address,
  ADD COLUMN description TEXT NULL AFTER beneficiary_details,
  ADD COLUMN city VARCHAR(150) NOT NULL DEFAULT '' AFTER description,
  ADD COLUMN pincode VARCHAR(20) NOT NULL DEFAULT '' AFTER city,
  ADD COLUMN workflow_status VARCHAR(32) NOT NULL DEFAULT 'in_progress' AFTER new_photo_path,
  ADD COLUMN block_reason TEXT NULL AFTER workflow_status,
  ADD COLUMN is_submitted TINYINT(1) NOT NULL DEFAULT 0 AFTER block_reason,
  ADD COLUMN is_approved TINYINT(1) NOT NULL DEFAULT 0 AFTER is_submitted,
  ADD COLUMN approval_comment TEXT NULL AFTER is_approved,
  ADD COLUMN approved_by INT UNSIGNED NULL AFTER approval_comment,
  ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL AFTER approved_by,
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER location_id,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD CONSTRAINT fk_projects_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_projects_approved_by FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
  ADD KEY idx_projects_status (status),
  ADD KEY idx_projects_submitted (is_submitted, is_approved);
