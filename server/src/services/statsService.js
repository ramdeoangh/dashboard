import { getPool } from '../config/database.js';

export async function portalStats(partnerId = null) {
  const pool = getPool();
  const partnerClause =
    partnerId != null && Number(partnerId) > 0 ? 'AND partner_id = ?' : '';
  const pParams = partnerId != null && Number(partnerId) > 0 ? [partnerId] : [];

  const [[{ totalProjects }]] = await pool.query(
    `SELECT COUNT(*) AS totalProjects FROM projects WHERE status = 1 AND is_submitted = 1 ${partnerClause}`,
    pParams
  );
  const [[{ totalStates }]] = await pool.query(`SELECT COUNT(*) AS totalStates FROM states WHERE is_active = 1`);
  const [[{ totalLocations }]] = await pool.query(
    `SELECT COUNT(*) AS totalLocations FROM locations WHERE is_active = 1`
  );
  const [[{ totalBeneficiaries }]] = await pool.query(
    `SELECT COUNT(*) AS totalBeneficiaries FROM projects
     WHERE status = 1 AND is_submitted = 1
       AND beneficiary_details IS NOT NULL AND beneficiary_details != '' ${partnerClause}`,
    pParams
  );
  return {
    totalProjects,
    totalStates,
    totalLocations,
    totalBeneficiaries,
  };
}

export async function adminStats(partnerId = null) {
  const pool = getPool();
  if (partnerId != null && Number(partnerId) > 0) {
    const pid = Number(partnerId);
    const [[{ users }]] = await pool.query(
      `SELECT COUNT(*) AS users FROM users WHERE is_active = 1 AND partner_id = ?`,
      [pid]
    );
    const [[{ projects }]] = await pool.query(
      `SELECT COUNT(*) AS projects FROM projects WHERE status = 1 AND partner_id = ?`,
      [pid]
    );
    const [[{ states }]] = await pool.query(`SELECT COUNT(*) AS states FROM states WHERE is_active = 1`);
    const [[{ locations }]] = await pool.query(
      `SELECT COUNT(*) AS locations FROM locations WHERE is_active = 1`
    );
    return { users, projects, states, locations };
  }
  const [[{ users }]] = await pool.query(`SELECT COUNT(*) AS users FROM users WHERE is_active = 1`);
  const [[{ projects }]] = await pool.query(`SELECT COUNT(*) AS projects FROM projects WHERE status = 1`);
  const [[{ states }]] = await pool.query(`SELECT COUNT(*) AS states FROM states WHERE is_active = 1`);
  const [[{ locations }]] = await pool.query(`SELECT COUNT(*) AS locations FROM locations WHERE is_active = 1`);
  return { users, projects, states, locations };
}
