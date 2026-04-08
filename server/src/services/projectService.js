import { getPool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { safeUnlink, toPublicUrl } from '../utils/uploadPath.js';

function normalizePhotoKind(raw) {
  const k = cellStr(raw)
    .toLowerCase()
    .trim();
  if (k === 'before' || k === 'after') return k;
  return '';
}

function cellStr(v) {
  if (v == null) return '';
  if (Buffer.isBuffer(v)) return v.toString('utf8');
  return String(v);
}

/** Normalize MySQL DATE / Date for API (YYYY-MM-DD). */
function fmtDate(v) {
  if (v == null || v === '') return null;
  let x = v;
  if (Buffer.isBuffer(x)) x = x.toString('utf8');
  if (x instanceof Date) {
    if (Number.isNaN(x.getTime())) return null;
    return x.toISOString().slice(0, 10);
  }
  const s = String(x).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

/** Four-digit year from ISO date string, or null. */
function yearFromStartDateString(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const y = parseInt(isoDate.slice(0, 4), 10);
  return Number.isFinite(y) && y >= 1900 && y <= 2100 ? y : null;
}

function mapPhotoRow(row) {
  if (!row) return null;
  const kind = normalizePhotoKind(row.kind);
  const filePath = Buffer.isBuffer(row.file_path) ? row.file_path.toString('utf8') : row.file_path;
  const originalName = Buffer.isBuffer(row.original_name)
    ? row.original_name.toString('utf8')
    : row.original_name;
  return {
    id: row.id != null ? Number(row.id) : null,
    projectId: row.project_id != null ? Number(row.project_id) : null,
    kind,
    filePath,
    originalName,
    sortOrder: row.sort_order,
    url: toPublicUrl(filePath),
  };
}

/** DB album rows + legacy projects.old_photo_path / new_photo_path when not already in album. */
function mergeLegacyColumnPhotos(project, mappedPhotos) {
  const rows = (mappedPhotos || []).filter((p) => p && p.kind && p.url);
  const urls = new Set(rows.map((p) => p.url).filter(Boolean));
  const photos = [...rows];
  if (project.oldPhotoUrl && !urls.has(project.oldPhotoUrl)) {
    photos.push({
      id: 'legacy-before-col',
      projectId: Number(project.id),
      kind: 'before',
      filePath: project.oldPhotoPath,
      originalName: null,
      sortOrder: -1,
      url: project.oldPhotoUrl,
    });
    urls.add(project.oldPhotoUrl);
  }
  if (project.newPhotoUrl && !urls.has(project.newPhotoUrl)) {
    photos.push({
      id: 'legacy-after-col',
      projectId: Number(project.id),
      kind: 'after',
      filePath: project.newPhotoPath,
      originalName: null,
      sortOrder: -1,
      url: project.newPhotoUrl,
    });
  }
  photos.sort((a, b) => {
    const ko = (k) => (k === 'before' ? 0 : 1);
    const c = ko(a.kind) - ko(b.kind);
    if (c !== 0) return c;
    const so = Number(a.sortOrder) - Number(b.sortOrder);
    if (so !== 0) return so;
    const ai = Number(a.id);
    const bi = Number(b.id);
    if (!Number.isFinite(ai) || !Number.isFinite(bi)) return 0;
    return ai - bi;
  });
  return photos;
}

function mapRow(row) {
  if (!row) return null;
  const beforePath = row.first_before_path || row.old_photo_path;
  const afterPath = row.first_after_path || row.new_photo_path;
  return {
    id: row.id != null ? Number(row.id) : row.id,
    projectName: row.project_name,
    procurementName: row.procurement_name,
    address: row.address,
    beneficiaryDetails: row.beneficiary_details,
    description: row.description,
    city: row.city,
    pincode: row.pincode,
    procurementType: row.procurement_type,
    contactNumber: row.contact_number,
    startDate: fmtDate(row.start_date),
    endDate: fmtDate(row.end_date),
    startYear:
      row.start_year != null && row.start_year !== ''
        ? Number(row.start_year)
        : yearFromStartDateString(fmtDate(row.start_date)),
    oldPhotoPath: row.old_photo_path,
    newPhotoPath: row.new_photo_path,
    oldPhotoUrl: toPublicUrl(beforePath),
    newPhotoUrl: toPublicUrl(afterPath),
    workflowStatus: row.workflow_status,
    blockReason: row.block_reason,
    // MySQL may return 0/1 as numbers or strings; Boolean("0") is true in JS — use numeric check.
    isSubmitted: row.is_submitted == 1,
    isApproved: row.is_approved == 1,
    approvalComment: row.approval_comment,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    categoryId: row.category_id,
    categoryName: row.category_name,
    stateId: row.state_id,
    locationId: row.location_id,
    stateName: row.state_name,
    stateCode: row.state_code,
    locationName: row.location_name,
    locationCode: row.location_code,
    beforePhotoCount: Number(row.before_photo_count || 0),
    afterPhotoCount: Number(row.after_photo_count || 0),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

const baseSelect = `
  SELECT p.*, s.name AS state_name, s.code AS state_code, l.name AS location_name, l.code AS location_code,
    c.name AS category_name,
    (SELECT COUNT(*) FROM project_photos pp WHERE pp.project_id = p.id AND pp.kind = 'before' AND pp.status = 1) AS before_photo_count,
    (SELECT COUNT(*) FROM project_photos pp WHERE pp.project_id = p.id AND pp.kind = 'after' AND pp.status = 1) AS after_photo_count,
    (SELECT pp.file_path FROM project_photos pp WHERE pp.project_id = p.id AND pp.kind = 'before' AND pp.status = 1 ORDER BY pp.sort_order ASC, pp.id ASC LIMIT 1) AS first_before_path,
    (SELECT pp.file_path FROM project_photos pp WHERE pp.project_id = p.id AND pp.kind = 'after' AND pp.status = 1 ORDER BY pp.sort_order ASC, pp.id ASC LIMIT 1) AS first_after_path
  FROM projects p
  INNER JOIN states s ON s.id = p.state_id
  INNER JOIN locations l ON l.id = p.location_id
  LEFT JOIN project_categories c ON c.id = p.category_id
`;

export async function assertLocationInState(stateId, locationId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id FROM locations WHERE id = ? AND state_id = ? LIMIT 1`,
    [locationId, stateId]
  );
  return rows.length > 0;
}

async function assertCategory(categoryId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id FROM project_categories WHERE id = ? AND status = 1 LIMIT 1`,
    [categoryId]
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
    // Portal reports: show every submitted project (pending approval still visible).
    clauses.push('p.is_submitted = 1');
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

async function listPhotosGroupedByProjectIds(projectIds) {
  const map = new Map();
  const uniq = [...new Set(projectIds.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))];
  if (!uniq.length) return map;
  const pool = getPool();
  const placeholders = uniq.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, project_id, kind, file_path, original_name, sort_order
     FROM project_photos
     WHERE project_id IN (${placeholders}) AND status = 1
     ORDER BY project_id ASC, kind ASC, sort_order ASC, id ASC`,
    uniq
  );
  for (const row of rows) {
    const pid = Number(row.project_id);
    const m = mapPhotoRow(row);
    if (!m || !m.kind || !m.url) continue;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid).push(m);
  }
  return map;
}

export async function listProjects(filters = {}) {
  const pool = getPool();
  const { where, params } = buildListWhere(filters);
  const sql = `${baseSelect} WHERE ${where} ORDER BY p.updated_at DESC, p.id DESC`;
  const [rows] = await pool.execute(sql, params);
  const mapped = rows.map(mapRow);
  if (filters.forPortal) {
    const byPid = mapped.length ? await listPhotosGroupedByProjectIds(mapped.map((r) => r.id)) : new Map();
    for (const r of mapped) {
      r.photos = mergeLegacyColumnPhotos(r, byPid.get(Number(r.id)) || []);
    }
  }
  return mapped;
}

export async function listPendingApproval(filters = {}) {
  return listProjects({ ...filters, pendingApproval: true, includeInactive: false });
}

export async function listProjectPhotos(projectId) {
  const pool = getPool();
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) return [];
  const [rows] = await pool.query(
    `SELECT id, project_id, kind, file_path, original_name, sort_order
     FROM project_photos
     WHERE project_id = ? AND status = 1
     ORDER BY kind ASC, sort_order ASC, id ASC`,
    [pid]
  );
  return rows.map(mapPhotoRow).filter((m) => m && m.kind && m.url);
}

/**
 * Portal photo album: same rows as admin GET /projects/:id/photos — all active project_photos
 * for this project (status = 1), plus legacy column URLs when not already in the album.
 * Only requires an active project (status = 1), not is_submitted, so behaviour matches admin.
 */
export async function getPortalProjectPhotos(projectId) {
  const p = await getProjectById(projectId);
  if (!p || Number(p.status) !== 1) return null;
  const album = await listProjectPhotos(projectId);
  return mergeLegacyColumnPhotos(p, album);
}

async function syncLegacyPhotoColumns(projectId, updatedBy) {
  const pool = getPool();
  const [beforeRows] = await pool.execute(
    `SELECT file_path FROM project_photos WHERE project_id = ? AND kind = 'before' AND status = 1 ORDER BY sort_order ASC, id ASC LIMIT 1`,
    [projectId]
  );
  const [afterRows] = await pool.execute(
    `SELECT file_path FROM project_photos WHERE project_id = ? AND kind = 'after' AND status = 1 ORDER BY sort_order ASC, id ASC LIMIT 1`,
    [projectId]
  );
  const oldP = beforeRows[0]?.file_path || null;
  const newP = afterRows[0]?.file_path || null;
  await pool.execute(
    `UPDATE projects SET old_photo_path = ?, new_photo_path = ?, updated_by = ? WHERE id = ?`,
    [oldP, newP, updatedBy || null, projectId]
  );
}

/**
 * Append new album rows only — never replaces or removes existing active photos.
 * Each batch is inserted after the current max sort_order for that project/kind (active rows only).
 */
export async function addProjectPhotoRows(projectId, kind, entries, userId) {
  if (!['before', 'after'].includes(kind)) throw new AppError(400, 'Invalid photo kind');
  const pool = getPool();
  const [maxRow] = await pool.execute(
    `SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_photos WHERE project_id = ? AND kind = ? AND status = 1`,
    [projectId, kind]
  );
  let sort = Number(maxRow[0].m) + 1;
  for (const e of entries) {
    await pool.execute(
      `INSERT INTO project_photos (project_id, kind, file_path, original_name, sort_order, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, kind, e.file_path, e.original_name || null, sort++, userId || null, userId || null]
    );
  }
  await syncLegacyPhotoColumns(projectId, userId);
}

export async function deleteProjectPhoto(projectId, photoId, userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT * FROM project_photos WHERE id = ? AND project_id = ? AND status = 1 LIMIT 1`,
    [photoId, projectId]
  );
  const row = rows[0];
  if (!row) return false;
  safeUnlink(row.file_path);
  await pool.execute(`UPDATE project_photos SET status = 0, updated_by = ? WHERE id = ?`, [
    userId || null,
    photoId,
  ]);
  await syncLegacyPhotoColumns(row.project_id, userId);
  return true;
}

export async function getProjectById(id, { withPhotos = false } = {}) {
  const pool = getPool();
  const [rows] = await pool.execute(`${baseSelect} WHERE p.id = ? LIMIT 1`, [id]);
  const mapped = mapRow(rows[0]);
  if (!mapped) return null;
  if (withPhotos) {
    const photos = await listProjectPhotos(id);
    mapped.beforePhotos = photos.filter((x) => x.kind === 'before');
    mapped.afterPhotos = photos.filter((x) => x.kind === 'after');
  }
  return mapped;
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
    start_date,
    end_date,
    state_id,
    location_id,
    category_id,
  } = body;
  const start_year = yearFromStartDateString(start_date);
  if (!start_date || !end_date) throw new AppError(400, 'start_date and end_date are required');
  if (String(end_date) < String(start_date)) throw new AppError(400, 'end_date must be on or after start_date');
  const ok = await assertLocationInState(state_id, location_id);
  if (!ok) throw new AppError(400, 'Location does not belong to the selected state');
  const catOk = await assertCategory(category_id);
  if (!catOk) throw new AppError(400, 'Invalid or inactive project category');
  const pool = getPool();
  const [r] = await pool.execute(
    `INSERT INTO projects (
      project_name, procurement_name, address, beneficiary_details, description, city, pincode,
      procurement_type, contact_number, start_date, end_date, start_year,
      category_id, state_id, location_id, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project_name,
      procurement_name ?? '',
      address,
      beneficiary_details,
      description,
      city || '',
      pincode || '',
      procurement_type || '',
      contact_number || '',
      start_date,
      end_date,
      start_year,
      category_id,
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

  let category_id = body.category_id ?? existing.categoryId;
  if (body.category_id !== undefined) {
    const catOk = await assertCategory(category_id);
    if (!catOk) throw new AppError(400, 'Invalid or inactive project category');
  }

  const project_name = body.project_name ?? existing.projectName;
  const procurement_name = body.procurement_name !== undefined ? body.procurement_name : existing.procurementName;
  const address = body.address ?? existing.address;
  const beneficiary_details =
    body.beneficiary_details !== undefined ? body.beneficiary_details : existing.beneficiaryDetails;
  const description = body.description !== undefined ? body.description : existing.description;
  const city = body.city !== undefined ? body.city : existing.city;
  const pincode = body.pincode !== undefined ? body.pincode : existing.pincode;
  const procurement_type = body.procurement_type !== undefined ? body.procurement_type : existing.procurementType;
  const contact_number = body.contact_number !== undefined ? body.contact_number : existing.contactNumber;
  const startDateVal = body.start_date !== undefined ? body.start_date : existing.startDate;
  const endDateVal = body.end_date !== undefined ? body.end_date : existing.endDate;
  if (startDateVal && endDateVal && String(endDateVal) < String(startDateVal)) {
    throw new AppError(400, 'end_date must be on or after start_date');
  }
  const start_year = yearFromStartDateString(startDateVal);

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
      city = ?, pincode = ?, procurement_type = ?, contact_number = ?,
      start_date = ?, end_date = ?, start_year = ?,
      workflow_status = ?, block_reason = ?,
      category_id = ?, state_id = ?, location_id = ?, updated_by = ?
    WHERE id = ? AND status = 1`,
    [
      project_name,
      procurement_name ?? '',
      address,
      beneficiary_details,
      description,
      city,
      pincode,
      procurement_type || '',
      contact_number || '',
      startDateVal || null,
      endDateVal || null,
      start_year,
      workflow_status,
      block_reason,
      category_id,
      state_id,
      location_id,
      updatedBy || null,
      id,
    ]
  );
  return getProjectById(id);
}

/** Legacy PUT body oldPhoto/newPhoto — appends rows like multipart POST; does not replace the album. */
export async function setProjectPhotoPaths(id, { old_photo_path, new_photo_path }, updatedBy) {
  const existing = await getProjectById(id);
  if (!existing) return null;
  if (existing.status === 0) throw new AppError(400, 'Project is deleted');
  if (old_photo_path !== undefined) {
    await addProjectPhotoRows(id, 'before', [{ file_path: old_photo_path, original_name: null }], updatedBy);
  }
  if (new_photo_path !== undefined) {
    await addProjectPhotoRows(id, 'after', [{ file_path: new_photo_path, original_name: null }], updatedBy);
  }
  return getProjectById(id);
}

async function countActivePhotos(projectId, kind) {
  const pool = getPool();
  const [[{ c }]] = await pool.query(
    `SELECT COUNT(*) AS c FROM project_photos WHERE project_id = ? AND kind = ? AND status = 1`,
    [projectId, kind]
  );
  return c;
}

export async function submitProject(id, updatedBy) {
  const p = await getProjectById(id);
  if (!p) throw new AppError(404, 'Project not found');
  if (p.status === 0) throw new AppError(400, 'Project is deleted');
  if (p.isSubmitted) throw new AppError(400, 'Project already submitted');

  const beforeC = await countActivePhotos(id, 'before');
  const afterC = await countActivePhotos(id, 'after');
  const hasLegacy = p.oldPhotoPath && p.newPhotoPath;
  if (!(beforeC > 0 && afterC > 0) && !hasLegacy) {
    throw new AppError(400, 'At least one before and one after photo are required before submit');
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
