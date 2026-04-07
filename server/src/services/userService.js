import bcrypt from 'bcryptjs';
import { getPool } from '../config/database.js';
import * as authService from './authService.js';

export async function listUsers() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.username, u.display_name, u.is_active, u.created_at, u.updated_at,
            GROUP_CONCAT(r.id) AS role_ids,
            GROUP_CONCAT(r.slug) AS role_slugs
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id AND r.status = 1
     GROUP BY u.id
     ORDER BY u.id`
  );
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.display_name,
    isActive: !!u.is_active,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    roleIds: u.role_ids ? u.role_ids.split(',').map(Number) : [],
    roleSlugs: u.role_slugs ? u.role_slugs.split(',') : [],
  }));
}

export async function getUserById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, email, username, display_name, is_active, created_at, updated_at FROM users WHERE id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const u = rows[0];
  const [ur] = await pool.execute(`SELECT role_id FROM user_roles WHERE user_id = ?`, [id]);
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.display_name,
    isActive: !!u.is_active,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    roleIds: ur.map((x) => x.role_id),
  };
}

export async function createUser(
  { email, username, password, display_name, is_active, role_ids },
  createdBy
) {
  const pool = getPool();
  const hash = await bcrypt.hash(password, 12);
  const [r] = await pool.execute(
    `INSERT INTO users (email, username, password_hash, display_name, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [email, username, hash, display_name || username, is_active ? 1 : 0, createdBy || null]
  );
  const uid = r.insertId;
  if (role_ids?.length) {
    for (const rid of role_ids) {
      await pool.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [uid, rid]);
    }
  }
  return uid;
}

export async function updateUser(
  id,
  { email, username, display_name, is_active, password, role_ids }
) {
  const pool = getPool();
  const [existing] = await pool.execute(`SELECT id FROM users WHERE id = ?`, [id]);
  if (!existing.length) return false;

  if (password && password.length > 0) {
    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      `UPDATE users SET email = ?, username = ?, display_name = ?, is_active = ?, password_hash = ? WHERE id = ?`,
      [email, username, display_name, is_active ? 1 : 0, hash, id]
    );
    await authService.revokeAllUserTokens(id);
  } else {
    await pool.execute(
      `UPDATE users SET email = ?, username = ?, display_name = ?, is_active = ? WHERE id = ?`,
      [email, username, display_name, is_active ? 1 : 0, id]
    );
    if (!is_active) await authService.revokeAllUserTokens(id);
  }

  if (role_ids) {
    await pool.execute(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
    for (const rid of role_ids) {
      await pool.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [id, rid]);
    }
    await authService.revokeAllUserTokens(id);
  }

  return true;
}

export async function deleteUser(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT id FROM users WHERE id = ?`, [id]);
  if (!rows.length) return false;
  await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
  return true;
}
