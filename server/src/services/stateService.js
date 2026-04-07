import { getPool } from '../config/database.js';

export async function listStates(activeOnly = false) {
  const pool = getPool();
  const sql = activeOnly
    ? `SELECT id, name, code, is_active, sort_order FROM states WHERE is_active = 1 ORDER BY sort_order, name`
    : `SELECT id, name, code, is_active, sort_order FROM states ORDER BY sort_order, name`;
  const [rows] = await pool.execute(sql);
  return rows;
}

export async function createState({ name, code, is_active, sort_order }) {
  const pool = getPool();
  const [r] = await pool.execute(
    `INSERT INTO states (name, code, is_active, sort_order) VALUES (?, ?, ?, ?)`,
    [name, code.toUpperCase(), is_active ? 1 : 0, sort_order ?? 0]
  );
  return r.insertId;
}

export async function updateState(id, { name, code, is_active, sort_order }) {
  const pool = getPool();
  await pool.execute(
    `UPDATE states SET name = ?, code = ?, is_active = ?, sort_order = ? WHERE id = ?`,
    [name, code.toUpperCase(), is_active ? 1 : 0, sort_order, id]
  );
}

export async function deleteState(id) {
  const pool = getPool();
  await pool.execute(`DELETE FROM states WHERE id = ?`, [id]);
}
