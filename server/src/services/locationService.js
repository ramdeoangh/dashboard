import { getPool } from '../config/database.js';

export async function listByState(stateId, activeOnly = false) {
  const pool = getPool();
  const sql = activeOnly
    ? `SELECT id, state_id, name, code, is_active, sort_order FROM locations WHERE state_id = ? AND is_active = 1 ORDER BY sort_order, name`
    : `SELECT id, state_id, name, code, is_active, sort_order FROM locations WHERE state_id = ? ORDER BY sort_order, name`;
  const [rows] = await pool.execute(sql, [stateId]);
  return rows;
}

export async function listAll() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT l.id, l.state_id, l.name, l.code, l.is_active, l.sort_order, s.name AS state_name, s.code AS state_code
     FROM locations l INNER JOIN states s ON s.id = l.state_id ORDER BY s.sort_order, l.sort_order, l.name`
  );
  return rows;
}

export async function createLocation({ state_id, name, code, is_active, sort_order }) {
  const pool = getPool();
  const [r] = await pool.execute(
    `INSERT INTO locations (state_id, name, code, is_active, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [state_id, name, code || null, is_active ? 1 : 0, sort_order ?? 0]
  );
  return r.insertId;
}

export async function updateLocation(id, { state_id, name, code, is_active, sort_order }) {
  const pool = getPool();
  await pool.execute(
    `UPDATE locations SET state_id = ?, name = ?, code = ?, is_active = ?, sort_order = ? WHERE id = ?`,
    [state_id, name, code || null, is_active ? 1 : 0, sort_order, id]
  );
}

export async function deleteLocation(id) {
  const pool = getPool();
  await pool.execute(`DELETE FROM locations WHERE id = ?`, [id]);
}
