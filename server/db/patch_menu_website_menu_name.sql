-- Rename menu-website nav label (run once if DB already had the old title).
UPDATE menus SET name = 'Menu Website setting - web settings' WHERE slug = 'menu-website';
