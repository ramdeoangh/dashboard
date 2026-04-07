import { getPool } from '../config/database.js';

export async function portalStats() {
  const pool = getPool();
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM projects WHERE status = 1 AND is_approved = 1`
  );
  const [byState] = await pool.query(
    `SELECT s.id, s.name, s.code, COUNT(p.id) AS project_count
     FROM states s
     LEFT JOIN projects p ON p.state_id = s.id AND p.status = 1 AND p.is_approved = 1
     GROUP BY s.id, s.name, s.code
     ORDER BY s.sort_order, s.name`
  );
  const [recent] = await pool.query(
    `SELECT p.id, p.project_name, p.updated_at, s.name AS state_name
     FROM projects p
     INNER JOIN states s ON s.id = p.state_id
     WHERE p.status = 1 AND p.is_approved = 1
     ORDER BY p.updated_at DESC
     LIMIT 8`
  );
  return { totalProjects: total, byState, recentUpdates: recent };
}

export async function adminStats() {
  const pool = getPool();
  const [[{ users }]] = await pool.query(`SELECT COUNT(*) AS users FROM users WHERE is_active = 1`);
  const [[{ projects }]] = await pool.query(`SELECT COUNT(*) AS projects FROM projects WHERE status = 1`);
  const [[{ states }]] = await pool.query(`SELECT COUNT(*) AS states FROM states WHERE is_active = 1`);
  const [[{ locations }]] = await pool.query(`SELECT COUNT(*) AS locations FROM locations WHERE is_active = 1`);
  return { users, projects, states, locations };
}
