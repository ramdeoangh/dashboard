import { getPool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export async function listCategories({ includeInactive = false } = {}) {
  const pool = getPool();
  let sql = `SELECT * FROM project_categories WHERE 1=1`;
  const params = [];
  if (!includeInactive) {
    sql += ` AND status = 1`;
  }
  sql += ` ORDER BY name ASC`;
  const [rows] = await pool.execute(sql, params);
  return rows.map(mapRow);
}

export async function getCategoryById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT * FROM project_categories WHERE id = ? LIMIT 1`, [id]);
  return mapRow(rows[0]);
}

export async function createCategory({ name, slug }, userId) {
  const pool = getPool();
  const s = String(slug || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!s) throw new AppError(400, 'Invalid slug');
  try {
    const [r] = await pool.execute(
      `INSERT INTO project_categories (name, slug, created_by, updated_by) VALUES (?, ?, ?, ?)`,
      [name.trim(), s, userId || null, userId || null]
    );
    return r.insertId;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new AppError(409, 'Slug already exists');
    throw e;
  }
}

export async function updateCategory(id, { name, slug, status }, userId) {
  const pool = getPool();
  const existing = await getCategoryById(id);
  if (!existing) return null;
  const nextName = name !== undefined ? String(name).trim() : existing.name;
  let nextSlug = existing.slug;
  if (slug !== undefined) {
    nextSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!nextSlug) throw new AppError(400, 'Invalid slug');
  }
  const nextStatus = status !== undefined ? (status ? 1 : 0) : existing.status;
  try {
    await pool.execute(
      `UPDATE project_categories SET name = ?, slug = ?, status = ?, updated_by = ? WHERE id = ?`,
      [nextName, nextSlug, nextStatus, userId || null, id]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new AppError(409, 'Slug already exists');
    throw e;
  }
  return getCategoryById(id);
}

export async function deleteCategory(id, userId) {
  const pool = getPool();
  const existing = await getCategoryById(id);
  if (!existing) return false;
  await pool.execute(`UPDATE project_categories SET status = 0, updated_by = ? WHERE id = ?`, [
    userId || null,
    id,
  ]);
  return true;
}
