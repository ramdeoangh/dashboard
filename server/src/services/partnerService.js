import { getPool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { safeUnlink, toPublicUrl } from '../utils/uploadPath.js';

export async function listPartners({ includeInactive = false, scopePartnerId = null } = {}) {
  const pool = getPool();
  const parts = [];
  if (!includeInactive) parts.push('is_active = 1');
  if (scopePartnerId != null && Number(scopePartnerId) > 0) {
    parts.push('id = ?');
  }
  const where = parts.length ? parts.join(' AND ') : '1=1';
  const params = scopePartnerId != null && Number(scopePartnerId) > 0 ? [scopePartnerId] : [];
  const [rows] = await pool.query(
    `SELECT id, name, slug, logo_path, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
     FROM partners WHERE ${where} ORDER BY name ASC, id ASC`,
    params
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoPath: r.logo_path || null,
    logoUrl: toPublicUrl(r.logo_path),
    isActive: !!r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getPartnerById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, slug, logo_path, is_active FROM partners WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoPath: r.logo_path || null,
    logoUrl: toPublicUrl(r.logo_path),
    isActive: !!r.is_active,
  };
}

export async function assertPartnerExists(partnerId) {
  const id = Number(partnerId);
  if (!Number.isInteger(id) || id <= 0) return false;
  const p = await getPartnerById(id);
  return Boolean(p && p.isActive);
}

export async function createPartner({ name, slug }, createdBy) {
  const pool = getPool();
  const n = String(name ?? '').trim();
  const s = String(slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!n) throw new AppError(400, 'Partner name is required');
  if (!s) throw new AppError(400, 'Partner slug is required (letters, numbers, hyphens)');
  try {
    const [r] = await pool.execute(
      `INSERT INTO partners (name, slug, is_active, created_by, updated_by) VALUES (?, ?, 1, ?, ?)`,
      [n, s, createdBy || null, createdBy || null]
    );
    return r.insertId;
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') throw new AppError(409, 'Partner slug already exists');
    throw e;
  }
}

export async function updatePartner(id, { name, slug, is_active }, updatedBy) {
  const pool = getPool();
  const existing = await getPartnerById(id);
  if (!existing) return false;
  const n = name !== undefined ? String(name).trim() : existing.name;
  const s =
    slug !== undefined
      ? String(slug)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : existing.slug;
  if (!n) throw new AppError(400, 'Partner name is required');
  if (!s) throw new AppError(400, 'Partner slug is required');
  const active = is_active !== undefined ? (is_active ? 1 : 0) : existing.isActive ? 1 : 0;
  try {
    await pool.execute(
      `UPDATE partners SET name = ?, slug = ?, is_active = ?, updated_by = ? WHERE id = ?`,
      [n, s, active, updatedBy || null, id]
    );
    return true;
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') throw new AppError(409, 'Partner slug already exists');
    throw e;
  }
}

export async function updatePartnerLogo(partnerId, relativePath, updatedBy) {
  const pool = getPool();
  const existing = await getPartnerById(partnerId);
  if (!existing) return false;
  if (existing.logoPath) safeUnlink(existing.logoPath);
  await pool.execute(`UPDATE partners SET logo_path = ?, updated_by = ? WHERE id = ?`, [
    relativePath,
    updatedBy || null,
    partnerId,
  ]);
  return true;
}
