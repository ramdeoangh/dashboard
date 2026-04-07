import { getPool } from '../config/database.js';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

/** Date-only YYYY-MM-DD → inclusive bounds; otherwise space-separated datetime */
function normalizeFromDay(value) {
  const s = String(value ?? '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  return `${s} 00:00:00`;
}

function normalizeToDay(value) {
  const s = String(value ?? '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  return `${s} 23:59:59`;
}

function normalizeMeta(meta) {
  if (meta == null) return null;
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta);
    } catch {
      return { _parseError: true, raw: meta };
    }
  }
  return meta;
}

/**
 * Lists error rows only (level = error). Legacy HTTP audit rows are excluded.
 */
export async function listApplicationErrorLogs({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  q,
  from,
  to,
}) {
  const pool = getPool();
  const rawSize = parseInt(String(pageSize), 10);
  const rawPage = parseInt(String(page), 10);
  const size = Math.min(Math.max(Number.isFinite(rawSize) && rawSize > 0 ? rawSize : DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const p = Math.max(Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1, 1);
  const offset = (p - 1) * size;
  /** LIMIT/OFFSET placeholders often cause ER_WRONG_ARGUMENTS with mysqld_stmt_execute; inline validated ints. */
  const lim = size;
  const off = Math.max(0, offset);

  const conditions = [`level = 'error'`];
  const params = [];

  const fromDay = normalizeFromDay(from);
  if (fromDay) {
    conditions.push('created_at >= ?');
    params.push(fromDay);
  }
  const toDay = normalizeToDay(to);
  if (toDay) {
    conditions.push('created_at <= ?');
    params.push(toDay);
  }
  if (q && String(q).trim()) {
    const term = `%${String(q).trim().slice(0, 200)}%`;
    conditions.push(
      '(message LIKE ? OR path LIKE ? OR correlation_id LIKE ? OR (meta IS NOT NULL AND CAST(meta AS CHAR(16380)) LIKE ?))'
    );
    params.push(term, term, term, term);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // pool.execute + positional ? fails when the pool uses namedPlaceholders:true (mysqld_stmt_execute).
  // query() uses text protocol with the same ? bindings, escaped by mysql2.
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM application_logs ${where}`, params);
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query(
    `SELECT id, correlation_id, level, message, meta, method, path, status_code, duration_ms,
            user_id, ip, user_agent, created_at
     FROM application_logs ${where}
     ORDER BY id DESC
     LIMIT ${lim} OFFSET ${off}`,
    params
  );

  const items = rows.map((r) => ({
    id: r.id,
    correlationId: r.correlation_id,
    level: r.level,
    message: r.message,
    meta: normalizeMeta(r.meta),
    method: r.method,
    path: r.path,
    statusCode: r.status_code,
    durationMs: r.duration_ms,
    userId: r.user_id,
    ip: r.ip,
    userAgent: r.user_agent,
    createdAt: r.created_at,
  }));

  return {
    items,
    total,
    page: p,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}
