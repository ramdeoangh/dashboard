import { getPool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { safeUnlink, toPublicUrl } from '../utils/uploadPath.js';

function sanitizeFolderSegment(s) {
  return String(s || 'x')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'x';
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectName: row.project_name,
    procurementName: row.procurement_name,
    address: row.address,
    beneficiaryDetails: row.beneficiary_details,
    description: row.description,
    city: row.city,
    pincode: row.pincode,
    procurementType: row.procurement_type,
    contactNumber: row.contact_number,
    durationCompletion: row.duration_completion,
    oldPhotoPath: row.old_photo_path,
    newPhotoPath: row.new_photo_path,
    oldPhotoUrl: toPublicUrl(row.old_photo_path),
    newPhotoUrl: toPublicUrl(row.new_photo_path),
    workflowStatus: row.workflow_status,
    blockReason: row.block_reason,
    isSubmitted: Boolean(row.is_submitted),
    isApproved: Boolean(row.is_approved),
    approvalComment: row.approval_comment,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    stateId: row.state_id,
    locationId: row.location_id,
    stateName: row.state_name,
    stateCode: row.state_code,
    locationName: row.location_name,
    locationCode: row.location_code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

const baseSelect = `
  SELECT p.*, s.name AS state_name, s.code AS state_code, l.name AS location_name, l.code AS location_code
  FROM projects p
  INNER JOIN states s ON s.id = p.state_id
  INNER JOIN locations l ON l.id = p.location_id
`;

export async function assertLocationInState(stateId, locationId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id FROM locations WHERE id = ? AND state_id = ? LIMIT 1`,
    [locationId, stateId]
  );
  return rows.length > 0;
}

function buildListWhere({ stateId, locationId, q, includeInactive, forPortal, pendingApproval }) {
  const clauses = ['1=1'];
  const params = [];
  if (!includeInactive) {
    clauses.push('p.status = 1');
  }
  if (forPortal) {
    clauses.push('p.is_approved = 1');
  }
  if (pendingApproval) {
    clauses.push('p.is_submitted = 1');
  }
  if (stateId) {
    clauses.push('p.state_id = ?');
    params.push(stateId);
  }
  if (locationId) {
    clauses.push('p.location_id = ?');
    params.push(locationId);
  }
  if (q && String(q).trim()) {
    const term = `%${String(q).trim()}%`;
    clauses.push(
      '(p.project_name LIKE ? OR p.description LIKE ? OR p.procurement_name LIKE ? OR p.beneficiary_details LIKE ?)'
    );
    params.push(term, term, term, term);
  }
  return { where: clauses.join(' AND '), params };
}

export async function listProjects(filters = {}) {
  const pool = getPool();
  const { where, params } = buildListWhere(filters);
  const sql = `${baseSelect} WHERE ${where} ORDER BY p.updated_at DESC, p.id DESC`;
  const [rows] = await pool.execute(sql, params);
  return rows.map(mapRow);
}

export async function listPendingApproval(filters = {}) {
  return listProjects({ ...filters, pendingApproval: true, includeInactive: false });
}

export async function getProjectById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`${baseSelect} WHERE p.id = ? LIMIT 1`, [id]);
  return mapRow(rows[0]);
}

/** Folder key under uploads/projects/{key}/before|after — no traversal. */
export async function getProjectPhotoFolderKey(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT p.id, s.code AS state_code, COALESCE(NULLIF(TRIM(l.code), ''), CONCAT('loc', l.id)) AS pax_code
     FROM projects p
     INNER JOIN states s ON s.id = p.state_id
     INNER JOIN locations l ON l.id = p.location_id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return `${r.id}_${sanitizeFolderSegment(r.state_code)}_${sanitizeFolderSegment(r.pax_code)}`;
}

export async function createProject(body, createdBy) {
  const {
    project_name,
    procurement_name,
    address,
    beneficiary_details,
    description,
    city,
    pincode,
    procurement_type,
    contact_number,
    duration_completion,
    state_id,
    location_id,
  } = body;
  const ok = await assertLocationInState(state_id, location_id);
  if (!ok) throw new AppError(400, 'Location does not belong to the selected state');
  const pool = getPool();
  const [r] = await pool.execute(
    `INSERT INTO projects (
      project_name, procurement_name, address, beneficiary_details, description, city, pincode,
      procurement_type, contact_number, duration_completion,
      state_id, location_id, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project_name,
      procurement_name,
      address,
      beneficiary_details || null,
      description || null,
      city || '',
      pincode || '',
      procurement_type || '',
      contact_number || '',
      duration_completion || '',
      state_id,
      location_id,
      createdBy || null,
      createdBy || null,
    ]
  );
  return r.insertId;
}

export async function updateProject(id, body, updatedBy) {
  const existing = await getProjectById(id);
  if (!existing) return null;
  if (existing.status === 0) throw new AppError(400, 'Project is deleted');

  const state_id = body.state_id ?? existing.stateId;
  const location_id = body.location_id ?? existing.locationId;
  const ok = await assertLocationInState(state_id, location_id);
  if (!ok) throw new AppError(400, 'Location does not belong to the selected state');

  const project_name = body.project_name ?? existing.projectName;
  const procurement_name = body.procurement_name ?? existing.procurementName;
  const address = body.address ?? existing.address;
  const beneficiary_details =
    body.beneficiary_details !== undefined ? body.beneficiary_details : existing.beneficiaryDetails;
  const description = body.description !== undefined ? body.description : existing.description;
  const city = body.city !== undefined ? body.city : existing.city;
  const pincode = body.pincode !== undefined ? body.pincode : existing.pincode;
  const procurement_type = body.procurement_type !== undefined ? body.procurement_type : existing.procurementType;
  const contact_number = body.contact_number !== undefined ? body.contact_number : existing.contactNumber;
  const duration_completion =
    body.duration_completion !== undefined ? body.duration_completion : existing.durationCompletion;

  let workflow_status = body.workflow_status ?? existing.workflowStatus;
  let block_reason = body.block_reason !== undefined ? body.block_reason : existing.blockReason;
  if (workflow_status === 'blocked' && (!block_reason || !String(block_reason).trim())) {
    throw new AppError(400, 'block_reason is required when workflow_status is blocked');
  }
  if (workflow_status !== 'blocked') {
    block_reason = null;
  }

  const pool = getPool();
  await pool.execute(
    `UPDATE projects SET
      project_name = ?, procurement_name = ?, address = ?, beneficiary_details = ?, description = ?,
      city = ?, pincode = ?, procurement_type = ?, contact_number = ?, duration_completion = ?,
      workflow_status = ?, block_reason = ?,
      state_id = ?, location_id = ?, updated_by = ?
    WHERE id = ? AND status = 1`,
    [
      project_name,
      procurement_name,
      address,
      beneficiary_details,
      description,
      city,
      pincode,
      procurement_type || '',
      contact_number || '',
      duration_completion || '',
      workflow_status,
      block_reason,
      state_id,
      location_id,
      updatedBy || null,
      id,
    ]
  );
  return getProjectById(id);
}

export async function setProjectPhotoPaths(id, { old_photo_path, new_photo_path }, updatedBy) {
  const existing = await getProjectById(id);
  if (!existing) return null;
  if (existing.status === 0) throw new AppError(400, 'Project is deleted');
  let oldP = existing.oldPhotoPath;
  let newP = existing.newPhotoPath;
  if (old_photo_path !== undefined) {
    if (oldP && oldP !== old_photo_path) safeUnlink(oldP);
    oldP = old_photo_path;
  }
  if (new_photo_path !== undefined) {
    if (newP && newP !== new_photo_path) safeUnlink(newP);
    newP = new_photo_path;
  }
  const pool = getPool();
  await pool.execute(
    `UPDATE projects SET old_photo_path = ?, new_photo_path = ?, updated_by = ? WHERE id = ?`,
    [oldP, newP, updatedBy || null, id]
  );
  return getProjectById(id);
}

export async function submitProject(id, updatedBy) {
  const p = await getProjectById(id);
  if (!p) throw new AppError(404, 'Project not found');
  if (p.status === 0) throw new AppError(400, 'Project is deleted');
  if (p.isSubmitted) throw new AppError(400, 'Project already submitted');

  if (!p.oldPhotoPath || !p.newPhotoPath) {
    throw new AppError(400, 'Both before and after photos are required before submit');
  }
  if (p.workflowStatus === 'blocked' && (!p.blockReason || !String(p.blockReason).trim())) {
    throw new AppError(400, 'block_reason is required when status is blocked');
  }

  const pool = getPool();
  await pool.execute(
    `UPDATE projects SET is_submitted = 1, updated_by = ? WHERE id = ? AND status = 1`,
    [updatedBy || null, id]
  );
  return getProjectById(id);
}

export async function updateApproval(id, { is_approved, approval_comment }, userId) {
  const p = await getProjectById(id);
  if (!p) throw new AppError(404, 'Project not found');
  if (p.status === 0) throw new AppError(400, 'Project is deleted');
  if (!p.isSubmitted) throw new AppError(400, 'Project is not submitted for approval');

  const pool = getPool();
  const approved = is_approved ? 1 : 0;
  await pool.execute(
    `UPDATE projects SET
      is_approved = ?,
      approval_comment = ?,
      approved_by = ?,
      approved_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
      updated_by = ?
    WHERE id = ? AND status = 1`,
    [
      approved,
      approval_comment ?? null,
      approved ? userId : null,
      approved,
      userId || null,
      id,
    ]
  );
  return getProjectById(id);
}

export async function softDeleteProject(id, updatedBy) {
  const p = await getProjectById(id);
  if (!p) return false;
  const pool = getPool();
  await pool.execute(`UPDATE projects SET status = 0, updated_by = ? WHERE id = ?`, [updatedBy || null, id]);
  return true;
}
