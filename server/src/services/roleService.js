import { getPool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const PROTECTED_SLUGS = new Set(['super_admin']);

export async function listRoles() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description, created_at, updated_at FROM roles ORDER BY id`
  );
  return rows;
}

export async function listPermissions() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, slug, resource, action FROM permissions ORDER BY resource, action`
  );
  return rows;
}

export async function getRoleById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT * FROM roles WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) return null;
  const [permRows] = await pool.execute(
    `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
    [id]
  );
  return {
    ...rows[0],
    permissionIds: permRows.map((r) => r.permission_id),
  };
}

export async function createRole({ name, slug, description }) {
  const pool = getPool();
  const [r] = await pool.execute(
    `INSERT INTO roles (name, slug, description) VALUES (?, ?, ?)`,
    [name, slug, description || null]
  );
  return r.insertId;
}

export async function updateRole(id, { name, slug, description }) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT slug FROM roles WHERE id = ?`, [id]);
  if (!rows.length) return false;
  if (PROTECTED_SLUGS.has(rows[0].slug) && slug !== rows[0].slug) {
    throw new AppError(400, 'Cannot change slug of protected role');
  }
  await pool.execute(`UPDATE roles SET name = ?, slug = ?, description = ? WHERE id = ?`, [
    name,
    slug,
    description || null,
    id,
  ]);
  return true;
}

export async function deleteRole(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT slug FROM roles WHERE id = ?`, [id]);
  if (!rows.length) return false;
  if (PROTECTED_SLUGS.has(rows[0].slug)) throw new AppError(400, 'Cannot delete protected role');
  await pool.execute(`DELETE FROM roles WHERE id = ?`, [id]);
  return true;
}

export async function setRolePermissions(roleId, permissionIds) {
  const pool = getPool();
  await pool.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);
  for (const pid of permissionIds) {
    await pool.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [
      roleId,
      pid,
    ]);
  }
}
