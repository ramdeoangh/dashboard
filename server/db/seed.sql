-- Idempotent seed: safe to re-run after first successful run (skips duplicates where noted)
SET NAMES utf8mb4;

INSERT INTO roles (name, slug, description) VALUES
  ('Super Admin', 'super_admin', 'Full system access'),
  ('Admin', 'admin', 'Manage content and users'),
  ('Viewer', 'viewer', 'Read-only portal access')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO permissions (name, slug, resource, action) VALUES
  ('Settings view', 'settings.view', 'settings', 'view'),
  ('Settings edit', 'settings.edit', 'settings', 'edit'),
  ('Users view', 'users.view', 'users', 'view'),
  ('Users create', 'users.create', 'users', 'create'),
  ('Users edit', 'users.edit', 'users', 'edit'),
  ('Users delete', 'users.delete', 'users', 'delete'),
  ('Roles view', 'roles.view', 'roles', 'view'),
  ('Roles edit', 'roles.edit', 'roles', 'edit'),
  ('Menus view', 'menus.view', 'menus', 'view'),
  ('Menus edit', 'menus.edit', 'menus', 'edit'),
  ('Pages view', 'pages.view', 'pages', 'view'),
  ('Pages edit', 'pages.edit', 'pages', 'edit'),
  ('States view', 'states.view', 'states', 'view'),
  ('States edit', 'states.edit', 'states', 'edit'),
  ('Projects view', 'projects.view', 'projects', 'view'),
  ('Projects create', 'projects.create', 'projects', 'create'),
  ('Projects edit', 'projects.edit', 'projects', 'edit'),
  ('Projects delete', 'projects.delete', 'projects', 'delete'),
  ('Projects approve', 'projects.approve', 'projects', 'approve'),
  ('Categories view', 'categories.view', 'categories', 'view'),
  ('Categories edit', 'categories.edit', 'categories', 'edit')
ON DUPLICATE KEY UPDATE name = VALUES(name), resource = VALUES(resource), action = VALUES(action);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'super_admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'admin' AND p.slug NOT IN ('users.delete', 'roles.edit')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'viewer' AND p.slug IN ('projects.view')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Top-level menu order: Projects, Users & Roles, Masters, Settings (last). Dashboard row exists for legacy; sidebar uses hardcoded Dashboard.
INSERT INTO menus (name, slug, path, icon, sort_order, status) VALUES
  ('Dashboard', 'dashboard', '/admin', 'layout-dashboard', 0, 1),
  ('Projects', 'projects', '#', 'briefcase', 10, 1),
  ('Users & Roles', 'users-roles', '#', 'users', 20, 1),
  ('Masters', 'masters', '#', 'map', 30, 1),
  ('Menu Website setting - web settings', 'menu-website', '#', 'settings', 90, 1),
  ('Settings', 'settings', '#', 'settings', 100, 1),
  ('Content', 'content', '#', 'folder', 999, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), icon = VALUES(icon), sort_order = VALUES(sort_order), status = VALUES(status);

UPDATE menus SET status = 0, sort_order = 999 WHERE slug = 'content';

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Portal & branding', 'portal-branding', '/admin/settings/portal', 0 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Email', 'email', '/admin/settings/email', 1 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add Menu', 'menu-website-add-menu', '/admin/settings/menu-website/add-menu', 0 FROM menus m WHERE m.slug = 'menu-website' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add Submenu', 'menu-website-add-submenu', '/admin/settings/menu-website/add-submenu', 1 FROM menus m WHERE m.slug = 'menu-website' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Dynamic pages', 'pages', '/admin/settings/pages', 2 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Application logs', 'application-logs', '/admin/settings/logs', 3 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add State', 'states', '/admin/states', 0 FROM menus m WHERE m.slug = 'masters' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add PAX', 'locations', '/admin/locations', 1 FROM menus m WHERE m.slug = 'masters' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Manage project', 'projects-manage', '/admin/projects/manage', 0 FROM menus m WHERE m.slug = 'projects' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add project', 'projects-add', '/admin/projects/new', 1 FROM menus m WHERE m.slug = 'projects' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Project category', 'projects-category', '/admin/projects/categories', 2 FROM menus m WHERE m.slug = 'projects' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Approve project', 'projects-approve', '/admin/projects/approve', 3 FROM menus m WHERE m.slug = 'projects' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

UPDATE submenus SET status = 0 WHERE slug = 'projects-approve';

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Users', 'users', '/admin/users', 0 FROM menus m WHERE m.slug = 'users-roles' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Roles', 'roles', '/admin/roles', 1 FROM menus m WHERE m.slug = 'users-roles' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM menus m CROSS JOIN roles r
WHERE r.slug IN ('super_admin', 'admin') AND m.status = 1
ON DUPLICATE KEY UPDATE menu_id = menu_id;

INSERT INTO submenu_roles (submenu_id, role_id)
SELECT s.id, r.id FROM submenus s
INNER JOIN menus m ON m.id = s.menu_id
CROSS JOIN roles r
WHERE r.slug IN ('super_admin', 'admin') AND s.status = 1 AND m.status = 1
ON DUPLICATE KEY UPDATE submenu_id = submenu_id;

INSERT INTO settings (setting_key, setting_value) VALUES
  ('portal.name', '"Project Reporting Portal"'),
  ('portal.logo_path', 'null'),
  ('portal.header_html', '"<p>Official project reporting</p>"'),
  ('portal.footer_html', '"<p>&copy; 2026</p>"'),
  ('email.smtp_host', '""'),
  ('email.smtp_port', '"587"'),
  ('email.smtp_user', '""'),
  ('email.smtp_secure', '"false"'),
  ('email.from_address', '""')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO project_categories (name, slug, status) VALUES
  ('General', 'general', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);

INSERT INTO pages (title, slug, content, is_published, sort_order) VALUES
  ('About', 'about', '<p>About this portal.</p>', 1, 1)
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), is_published = VALUES(is_published);
