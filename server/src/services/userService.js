import bcrypt from 'bcryptjs';
import { getPool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import * as authService from './authService.js';
import * as partnerService from './partnerService.js';

/** Positive integer partner id, null if unset, or 'invalid' if client sent a non-empty unusable value */
function parseRequestedPartnerId(raw) {
  if (raw === undefined || raw === null || raw === '') return { id: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return { id: null, invalid: true };
  return { id: n };
}

export async function listUsers(actorPartnerId = null) {
  const pool = getPool();
  const scopeClause =
    actorPartnerId != null && Number.isInteger(Number(actorPartnerId)) && Number(actorPartnerId) > 0
      ? 'WHERE u.partner_id = ?'
      : '';
  const params = scopeClause ? [actorPartnerId] : [];
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.username, u.display_name, u.is_active, u.partner_id, u.created_at, u.updated_at,
            pt.name AS partner_name,
            GROUP_CONCAT(r.id) AS role_ids,
            GROUP_CONCAT(r.slug) AS role_slugs
     FROM users u
     LEFT JOIN partners pt ON pt.id = u.partner_id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id AND r.status = 1
     ${scopeClause}
     GROUP BY u.id, u.email, u.username, u.display_name, u.is_active, u.partner_id, u.created_at, u.updated_at, pt.name
     ORDER BY u.id`,
    params
  );
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.display_name,
    isActive: !!u.is_active,
    partnerId: u.partner_id != null ? Number(u.partner_id) : null,
    partnerName: u.partner_name || null,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    roleIds: u.role_ids ? u.role_ids.split(',').map(Number) : [],
    roleSlugs: u.role_slugs ? u.role_slugs.split(',') : [],
  }));
}

export async function getUserById(id, actorPartnerId = null) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.username, u.display_name, u.is_active, u.partner_id, pt.name AS partner_name,
            u.created_at, u.updated_at
     FROM users u
     LEFT JOIN partners pt ON pt.id = u.partner_id
     WHERE u.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const u = rows[0];
  if (
    actorPartnerId != null &&
    Number(u.partner_id || 0) !== Number(actorPartnerId)
  ) {
    return null;
  }
  const [ur] = await pool.execute(`SELECT role_id FROM user_roles WHERE user_id = ?`, [id]);
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.display_name,
    isActive: !!u.is_active,
    partnerId: u.partner_id != null ? Number(u.partner_id) : null,
    partnerName: u.partner_name || null,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    roleIds: ur.map((x) => x.role_id),
  };
}

export async function createUser(
  { email, username, password, display_name, is_active, role_ids, partner_id },
  createdBy,
  actorPartnerId = null
) {
  const pool = getPool();
  let resolvedPartnerId = null;
  if (actorPartnerId != null && Number(actorPartnerId) > 0) {
    resolvedPartnerId = Number(actorPartnerId);
  } else {
    const parsed = parseRequestedPartnerId(partner_id);
    if (parsed.invalid) {
      throw new AppError(400, 'Invalid partner_id');
    }
    if (parsed.id != null) {
      const ok = await partnerService.assertPartnerExists(parsed.id);
      if (!ok) throw new AppError(400, 'Invalid or inactive partner');
      resolvedPartnerId = parsed.id;
    }
  }

  const hash = await bcrypt.hash(password, 12);
  const [r] = await pool.execute(
    `INSERT INTO users (email, username, password_hash, display_name, partner_id, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      email,
      username,
      hash,
      display_name || username,
      resolvedPartnerId,
      is_active ? 1 : 0,
      createdBy || null,
    ]
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
  { email, username, display_name, is_active, password, role_ids, partner_id },
  actorPartnerId = null
) {
  const pool = getPool();
  const [existingRows] = await pool.execute(
    `SELECT id, partner_id FROM users WHERE id = ?`,
    [id]
  );
  if (!existingRows.length) return false;
  const existing = existingRows[0];
  if (
    actorPartnerId != null &&
    Number(existing.partner_id || 0) !== Number(actorPartnerId)
  ) {
    return false;
  }

  let nextPartnerId = existing.partner_id;
  if (actorPartnerId == null && partner_id !== undefined) {
    if (partner_id === null || partner_id === '') {
      nextPartnerId = null;
    } else {
      const n = Number(partner_id);
      if (!Number.isInteger(n) || n <= 0) throw new AppError(400, 'Invalid partner');
      const ok = await partnerService.assertPartnerExists(n);
      if (!ok) throw new AppError(400, 'Invalid or inactive partner');
      nextPartnerId = n;
    }
  } else if (actorPartnerId != null) {
    nextPartnerId = Number(actorPartnerId);
  }

  if (password && password.length > 0) {
    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      `UPDATE users SET email = ?, username = ?, display_name = ?, partner_id = ?, is_active = ?, password_hash = ? WHERE id = ?`,
      [email, username, display_name, nextPartnerId, is_active ? 1 : 0, hash, id]
    );
    await authService.revokeAllUserTokens(id);
  } else {
    await pool.execute(
      `UPDATE users SET email = ?, username = ?, display_name = ?, partner_id = ?, is_active = ? WHERE id = ?`,
      [email, username, display_name, nextPartnerId, is_active ? 1 : 0, id]
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

export async function deleteUser(id, actorPartnerId = null) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT id, partner_id FROM users WHERE id = ?`, [id]);
  if (!rows.length) return false;
  if (
    actorPartnerId != null &&
    Number(rows[0].partner_id || 0) !== Number(actorPartnerId)
  ) {
    return false;
  }
  await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
  return true;
}
