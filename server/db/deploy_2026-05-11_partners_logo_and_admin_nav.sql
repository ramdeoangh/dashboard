-- ---------------------------------------------------------------------------
-- One-off deploy script (2026-05-11): partner logo column + Masters nav item
-- Combines migrations 006_partners_logo.sql and 007_masters_partners_admin_nav.sql
-- Safe to run on a server that may already have some of this applied.
-- Requires: partners table, menus row slug=masters, roles super_admin/admin.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

-- --- From 006_partners_logo.sql: partners.logo_path --------------------------------
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

-- --- From 007_masters_partners_admin_nav.sql: submenus + submenu_roles ------------

INSERT INTO submenus (menu_id, name, slug, path, sort_order, status)
SELECT m.id, 'Partners', 'masters-partners', '/admin/partners', 2, 1
FROM menus m
WHERE m.slug = 'masters'
  AND m.status = 1
  AND NOT EXISTS (
    SELECT 1 FROM submenus s2 WHERE s2.menu_id = m.id AND s2.slug = 'masters-partners'
  )
LIMIT 1;

UPDATE submenus s
INNER JOIN menus m ON m.id = s.menu_id
SET s.status = 1, s.path = '/admin/partners', s.sort_order = 2
WHERE m.slug = 'masters' AND s.slug = 'masters-partners';

INSERT INTO submenu_roles (submenu_id, role_id)
SELECT s.id, r.id
FROM submenus s
INNER JOIN menus m ON m.id = s.menu_id
INNER JOIN roles r ON r.slug IN ('super_admin', 'admin') AND r.status = 1
WHERE m.slug = 'masters' AND s.slug = 'masters-partners' AND s.status = 1
ON DUPLICATE KEY UPDATE submenu_id = VALUES(submenu_id);
