-- Menu Website Settings: top-level nav group with Add Menu / Add Submenu; retire Settings > Menus link.

INSERT INTO menus (name, slug, path, icon, sort_order, status)
SELECT 'Menu Website setting - web settings', 'menu-website', '#', 'settings', 90, 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE slug = 'menu-website');

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add Menu', 'menu-website-add-menu', '/admin/settings/menu-website/add-menu', 0
FROM menus m
WHERE m.slug = 'menu-website'
  AND NOT EXISTS (SELECT 1 FROM submenus s WHERE s.slug = 'menu-website-add-menu')
LIMIT 1;

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add Submenu', 'menu-website-add-submenu', '/admin/settings/menu-website/add-submenu', 1
FROM menus m
WHERE m.slug = 'menu-website'
  AND NOT EXISTS (SELECT 1 FROM submenus s WHERE s.slug = 'menu-website-add-submenu')
LIMIT 1;

UPDATE submenus s
INNER JOIN menus m ON m.id = s.menu_id AND m.slug = 'settings'
SET s.status = 0
WHERE s.slug = 'menus';

UPDATE submenus s
INNER JOIN menus m ON m.id = s.menu_id AND m.slug = 'settings'
SET s.sort_order = 2
WHERE s.slug = 'pages';

UPDATE submenus s
INNER JOIN menus m ON m.id = s.menu_id AND m.slug = 'settings'
SET s.sort_order = 3
WHERE s.slug = 'application-logs';

INSERT INTO menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM menus m CROSS JOIN roles r
WHERE m.slug = 'menu-website' AND r.slug IN ('super_admin', 'admin')
ON DUPLICATE KEY UPDATE menu_id = menu_id;

INSERT INTO submenu_roles (submenu_id, role_id)
SELECT s.id, r.id FROM submenus s
INNER JOIN menus m ON m.id = s.menu_id
CROSS JOIN roles r
WHERE m.slug = 'menu-website' AND r.slug IN ('super_admin', 'admin') AND s.status = 1
ON DUPLICATE KEY UPDATE submenu_id = submenu_id;

UPDATE menus SET name = 'Menu Website setting - web settings' WHERE slug = 'menu-website';
