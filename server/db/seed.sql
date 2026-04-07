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
  ('Projects approve', 'projects.approve', 'projects', 'approve')
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

-- Existing DBs: UPDATE menus SET path = '#' WHERE slug = 'settings';
INSERT INTO menus (name, slug, path, icon, sort_order) VALUES
  ('Dashboard', 'dashboard', '/admin', 'layout-dashboard', 0),
  ('Settings', 'settings', '#', 'settings', 10),
  ('Content', 'content', '#', 'folder', 20),
  ('Masters', 'masters', '#', 'map', 30),
  ('Projects', 'projects', '#', 'briefcase', 40),
  ('Users & Roles', 'users-roles', '#', 'users', 50)
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Portal & branding', 'portal-branding', '/admin/settings/portal', 0 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Email', 'email', '/admin/settings/email', 1 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Menus', 'menus', '/admin/settings/menus', 2 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Dynamic pages', 'pages', '/admin/settings/pages', 3 FROM menus m WHERE m.slug = 'settings' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'States', 'states', '/admin/states', 0 FROM menus m WHERE m.slug = 'masters' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'PAX locations', 'locations', '/admin/locations', 1 FROM menus m WHERE m.slug = 'masters' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Add project', 'projects-add', '/admin/projects/new', 0 FROM menus m WHERE m.slug = 'projects' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Approve project', 'projects-approve', '/admin/projects/approve', 1 FROM menus m WHERE m.slug = 'projects' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Users', 'users', '/admin/users', 0 FROM menus m WHERE m.slug = 'users-roles' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO submenus (menu_id, name, slug, path, sort_order)
SELECT m.id, 'Roles', 'roles', '/admin/roles', 1 FROM menus m WHERE m.slug = 'users-roles' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), path = VALUES(path), sort_order = VALUES(sort_order);

INSERT INTO menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM menus m CROSS JOIN roles r
WHERE r.slug IN ('super_admin', 'admin')
ON DUPLICATE KEY UPDATE menu_id = menu_id;

INSERT INTO submenu_roles (submenu_id, role_id)
SELECT s.id, r.id FROM submenus s CROSS JOIN roles r
WHERE r.slug IN ('super_admin', 'admin')
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

INSERT INTO states (name, code, is_active, sort_order) VALUES
  ('California', 'CA', 1, 1),
  ('Texas', 'TX', 1, 2),
  ('New York', 'NY', 1, 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'Los Angeles PAX', 'LA-PAX', 1, 1 FROM states s WHERE s.code = 'CA' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'San Diego PAX', 'SD-PAX', 1, 2 FROM states s WHERE s.code = 'CA' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'Houston PAX', 'HOU-PAX', 1, 1 FROM states s WHERE s.code = 'TX' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'NYC PAX', 'NYC-PAX', 1, 1 FROM states s WHERE s.code = 'NY' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO pages (title, slug, content, is_published, sort_order) VALUES
  ('About', 'about', '<p>About this portal.</p>', 1, 1)
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), is_published = VALUES(is_published);
