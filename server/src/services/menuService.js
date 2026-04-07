import { getPool } from '../config/database.js';

function menuRow(m, roleIds, submenus) {
  return {
    id: m.id,
    name: m.name,
    slug: m.slug,
    path: m.path,
    icon: m.icon,
    sort_order: m.sort_order,
    is_active: Boolean(m.status),
    roleIds,
    submenus,
  };
}

export async function listMenusWithRoles() {
  const pool = getPool();
  const [menus] = await pool.execute(
    `SELECT id, name, slug, path, icon, sort_order, status FROM menus ORDER BY sort_order, id`
  );
  const [submenus] = await pool.execute(
    `SELECT id, menu_id, name, slug, path, sort_order, status FROM submenus ORDER BY menu_id, sort_order, id`
  );
  const [mr] = await pool.execute(`SELECT menu_id, role_id FROM menu_roles`);
  const [sr] = await pool.execute(`SELECT submenu_id, role_id FROM submenu_roles`);

  const menuRoles = new Map();
  for (const x of mr) {
    if (!menuRoles.has(x.menu_id)) menuRoles.set(x.menu_id, []);
    menuRoles.get(x.menu_id).push(x.role_id);
  }
  const subRoles = new Map();
  for (const x of sr) {
    if (!subRoles.has(x.submenu_id)) subRoles.set(x.submenu_id, []);
    subRoles.get(x.submenu_id).push(x.role_id);
  }

  const subByMenu = new Map();
  for (const s of submenus) {
    if (!subByMenu.has(s.menu_id)) subByMenu.set(s.menu_id, []);
    subByMenu.get(s.menu_id).push({
      id: s.id,
      menu_id: s.menu_id,
      name: s.name,
      slug: s.slug,
      path: s.path,
      sort_order: s.sort_order,
      is_active: Boolean(s.status),
      roleIds: subRoles.get(s.id) || [],
    });
  }

  return menus.map((m) =>
    menuRow(m, menuRoles.get(m.id) || [], subByMenu.get(m.id) || [])
  );
}

export async function createMenu({ name, slug, path, icon, sort_order, is_active, roleIds }) {
  const pool = getPool();
  const status = is_active === false ? 0 : 1;
  const [r] = await pool.execute(
    `INSERT INTO menus (name, slug, path, icon, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, slug, path || '', icon || null, sort_order ?? 0, status]
  );
  const id = r.insertId;
  if (roleIds?.length) {
    for (const rid of roleIds) {
      await pool.execute(`INSERT IGNORE INTO menu_roles (menu_id, role_id) VALUES (?, ?)`, [id, rid]);
    }
  }
  return id;
}

export async function updateMenu(id, { name, slug, path, icon, sort_order, is_active, roleIds }) {
  const pool = getPool();
  const status = is_active === false ? 0 : 1;
  await pool.execute(
    `UPDATE menus SET name = ?, slug = ?, path = ?, icon = ?, sort_order = ?, status = ? WHERE id = ?`,
    [name, slug, path ?? '', icon ?? null, sort_order, status, id]
  );
  if (roleIds) {
    await pool.execute(`DELETE FROM menu_roles WHERE menu_id = ?`, [id]);
    for (const rid of roleIds) {
      await pool.execute(`INSERT INTO menu_roles (menu_id, role_id) VALUES (?, ?)`, [id, rid]);
    }
  }
}

export async function deleteMenu(id) {
  const pool = getPool();
  await pool.execute(`DELETE FROM menus WHERE id = ?`, [id]);
}

export async function createSubmenu({ menu_id, name, slug, path, sort_order, is_active, roleIds }) {
  const pool = getPool();
  const status = is_active === false ? 0 : 1;
  const [r] = await pool.execute(
    `INSERT INTO submenus (menu_id, name, slug, path, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [menu_id, name, slug, path || '', sort_order ?? 0, status]
  );
  const id = r.insertId;
  if (roleIds?.length) {
    for (const rid of roleIds) {
      await pool.execute(`INSERT IGNORE INTO submenu_roles (submenu_id, role_id) VALUES (?, ?)`, [id, rid]);
    }
  }
  return id;
}

export async function updateSubmenu(id, { name, slug, path, sort_order, is_active, roleIds }) {
  const pool = getPool();
  const status = is_active === false ? 0 : 1;
  await pool.execute(
    `UPDATE submenus SET name = ?, slug = ?, path = ?, sort_order = ?, status = ? WHERE id = ?`,
    [name, slug, path ?? '', sort_order, status, id]
  );
  if (roleIds) {
    await pool.execute(`DELETE FROM submenu_roles WHERE submenu_id = ?`, [id]);
    for (const rid of roleIds) {
      await pool.execute(`INSERT INTO submenu_roles (submenu_id, role_id) VALUES (?, ?)`, [id, rid]);
    }
  }
}

export async function deleteSubmenu(id) {
  const pool = getPool();
  await pool.execute(`DELETE FROM submenus WHERE id = ?`, [id]);
}

export async function getRoleMenuAccess(roleId) {
  const pool = getPool();
  const [menus] = await pool.execute(`SELECT menu_id FROM menu_roles WHERE role_id = ?`, [roleId]);
  const [subs] = await pool.execute(`SELECT submenu_id FROM submenu_roles WHERE role_id = ?`, [roleId]);
  return {
    menuIds: menus.map((x) => x.menu_id),
    submenuIds: subs.map((x) => x.submenu_id),
  };
}

export async function setRoleMenuAccess(roleId, { menuIds, submenuIds }) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM menu_roles WHERE role_id = ?`, [roleId]);
    await conn.execute(`DELETE FROM submenu_roles WHERE role_id = ?`, [roleId]);
    for (const mid of menuIds) {
      await conn.execute(`INSERT IGNORE INTO menu_roles (menu_id, role_id) VALUES (?, ?)`, [mid, roleId]);
    }
    for (const sid of submenuIds) {
      await conn.execute(`INSERT IGNORE INTO submenu_roles (submenu_id, role_id) VALUES (?, ?)`, [sid, roleId]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
