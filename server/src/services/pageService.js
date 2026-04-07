import { getPool } from '../config/database.js';

export async function listPages() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, title, slug, content, is_published, sort_order, created_at, updated_at FROM pages ORDER BY sort_order, id`
  );
  return rows;
}

export async function getPageBySlug(slug) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, title, slug, content, is_published FROM pages WHERE slug = ? AND is_published = 1 LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export async function createPage({ title, slug, content, is_published, sort_order }) {
  const pool = getPool();
  const [r] = await pool.execute(
    `INSERT INTO pages (title, slug, content, is_published, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [title, slug, content ?? '', is_published ? 1 : 0, sort_order ?? 0]
  );
  return r.insertId;
}

export async function updatePage(id, { title, slug, content, is_published, sort_order }) {
  const pool = getPool();
  await pool.execute(
    `UPDATE pages SET title = ?, slug = ?, content = ?, is_published = ?, sort_order = ? WHERE id = ?`,
    [title, slug, content, is_published ? 1 : 0, sort_order, id]
  );
}

export async function deletePage(id) {
  const pool = getPool();
  await pool.execute(`DELETE FROM pages WHERE id = ?`, [id]);
}
