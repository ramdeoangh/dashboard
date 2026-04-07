-- Add Settings → Application logs submenu (idempotent). Run if seed was applied before this item existed.
INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Application logs', 'application-logs', '/admin/settings/logs', 4 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenu_roles (submenu_id, role_id)
SELECT s.id, r.id FROM submenus s
INNER JOIN menus m ON m.id = s.menu_id
CROSS JOIN roles r
WHERE m.slug = 'settings' AND s.slug = 'application-logs' AND r.slug IN ('super_admin', 'admin')
ON DUPLICATE KEY UPDATE submenu_id = submenu_id;
