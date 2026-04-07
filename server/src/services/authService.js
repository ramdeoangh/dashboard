import bcrypt from 'bcryptjs';
import { getPool } from '../config/database.js';
import {
  hashToken,
  newRefreshRaw,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { env } from '../config/env.js';

export async function loadUserAuthz(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
    SELECT u.id, u.email, u.username, u.display_name, u.is_active,
           GROUP_CONCAT(DISTINCT r.slug) AS role_slugs,
           GROUP_CONCAT(DISTINCT p.slug) AS perm_slugs
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = :uid
    GROUP BY u.id, u.email, u.username, u.display_name, u.is_active
    `,
    { uid: userId }
  );
  if (!rows.length) return null;
  const u = rows[0];
  if (!u.is_active) return null;
  const roles = u.role_slugs ? u.role_slugs.split(',') : [];
  const permissions = u.perm_slugs ? u.perm_slugs.split(',') : [];
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.display_name,
    roles,
    permissions,
  };
}

export async function getNavForUser(roleSlugs) {
  const pool = getPool();
  if (!roleSlugs.length) return [];

  const placeholders = roleSlugs.map(() => '?').join(',');
  const [menus] = await pool.query(
    `
    SELECT DISTINCT m.id, m.name, m.slug, m.path, m.icon, m.sort_order
    FROM menus m
    INNER JOIN menu_roles mr ON mr.menu_id = m.id
    INNER JOIN roles r ON r.id = mr.role_id
    WHERE r.slug IN (${placeholders})
    ORDER BY m.sort_order ASC, m.id ASC
    `,
    roleSlugs
  );

  const [submenus] = await pool.query(
    `
    SELECT DISTINCT s.id, s.menu_id, s.name, s.slug, s.path, s.sort_order
    FROM submenus s
    INNER JOIN submenu_roles sr ON sr.submenu_id = s.id
    INNER JOIN roles r ON r.id = sr.role_id
    WHERE r.slug IN (${placeholders})
    ORDER BY s.menu_id ASC, s.sort_order ASC, s.id ASC
    `,
    roleSlugs
  );

  const subByMenu = new Map();
  for (const s of submenus) {
    if (!subByMenu.has(s.menu_id)) subByMenu.set(s.menu_id, []);
    subByMenu.get(s.menu_id).push({
      id: s.id,
      name: s.name,
      slug: s.slug,
      path: s.path,
      sortOrder: s.sort_order,
    });
  }

  return menus.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    path: m.path,
    icon: m.icon,
    sortOrder: m.sort_order,
    submenus: subByMenu.get(m.id) || [],
  }));
}

function accessPayload(user) {
  return {
    sub: String(user.id),
    username: user.username,
    displayName: user.displayName,
    roles: user.roles,
    permissions: user.permissions,
  };
}

export async function login(username, password, meta = {}) {
  const pool = getPool();
  const u = String(username ?? '').trim();
  const p = String(password ?? '');
  const [rows] = await pool.execute(
    `SELECT id, email, username, password_hash, display_name, is_active FROM users WHERE username = :uname OR email = :email LIMIT 1`,
    { uname: u, email: u }
  );
  if (!rows.length) return { error: 'Invalid credentials' };
  const row = rows[0];
  if (!row.is_active) return { error: 'Account disabled' };
  const ok = await bcrypt.compare(p, row.password_hash);
  if (!ok) return { error: 'Invalid credentials' };

  const authz = await loadUserAuthz(row.id);
  if (!authz) return { error: 'Invalid credentials' };

  const accessToken = signAccessToken(accessPayload(authz));
  const refreshRaw = newRefreshRaw();
  const refreshJwt = signRefreshToken({ sub: String(row.id), jti: refreshRaw });
  const tokenHash = hashToken(refreshRaw);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.jwt.refreshExpiresDays);

  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [row.id, tokenHash, expiresAt]
  );

  const nav = await getNavForUser(authz.roles);

  return {
    accessToken,
    refreshToken: refreshJwt,
    user: {
      id: authz.id,
      email: authz.email,
      username: authz.username,
      displayName: authz.displayName,
      roles: authz.roles,
      permissions: authz.permissions,
      adminNav: nav,
    },
  };
}

export async function refresh(refreshJwt) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshJwt);
  } catch {
    return { error: 'Invalid refresh token' };
  }
  const userId = Number(decoded.sub);
  const jti = decoded.jti;
  if (!jti) return { error: 'Invalid refresh token' };
  const th = hashToken(jti);
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, user_id FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1`,
    [th]
  );
  if (!rows.length) return { error: 'Invalid refresh token' };

  const authz = await loadUserAuthz(userId);
  if (!authz) return { error: 'Invalid refresh token' };

  const accessToken = signAccessToken(accessPayload(authz));
  const nav = await getNavForUser(authz.roles);
  return {
    accessToken,
    user: {
      id: authz.id,
      email: authz.email,
      username: authz.username,
      displayName: authz.displayName,
      roles: authz.roles,
      permissions: authz.permissions,
      adminNav: nav,
    },
  };
}

export async function logout(refreshJwt) {
  if (!refreshJwt) return;
  try {
    const decoded = verifyRefreshToken(refreshJwt);
    const jti = decoded.jti;
    if (!jti) return;
    const th = hashToken(jti);
    const pool = getPool();
    await pool.execute(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL`,
      [th]
    );
  } catch {
    /* ignore */
  }
}

export async function revokeAllUserTokens(userId) {
  const pool = getPool();
  await pool.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`, [
    userId,
  ]);
}
