-- Masters → Partners: admin sidebar (submenus + submenu_roles). Idempotent.
-- Run against your app database if "Partners" is missing under Masters after upgrading.
SET NAMES utf8mb4;

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
