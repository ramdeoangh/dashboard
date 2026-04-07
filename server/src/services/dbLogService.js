import { getPool } from '../config/database.js';

/**
 * Persists a structured log row. Never throws — failures are ignored so logging cannot break requests.
 */
export async function writeApplicationLog(row) {
  try {
    const pool = getPool();
    const message = String(row.message ?? '').slice(0, 1000);
    let metaJson = null;
    if (row.meta !== undefined && row.meta !== null) {
      try {
        metaJson = JSON.stringify(row.meta);
        if (metaJson.length > 16000) {
          metaJson = JSON.stringify({ truncated: true, preview: metaJson.slice(0, 8000) });
        }
      } catch {
        metaJson = JSON.stringify({ serializeError: true });
      }
    }
    await pool.execute(
      `INSERT INTO application_logs (
        correlation_id, level, message, meta, method, path, status_code, duration_ms, user_id, ip, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.correlationId ?? null,
        String(row.level ?? 'info').slice(0, 20),
        message,
        metaJson,
        row.method ? String(row.method).slice(0, 12) : null,
        row.path ? String(row.path).slice(0, 500) : null,
        row.statusCode ?? null,
        row.durationMs ?? null,
        row.userId ?? null,
        row.ip ? String(row.ip).slice(0, 45) : null,
        row.userAgent ? String(row.userAgent).slice(0, 512) : null,
      ]
    );
  } catch {
    /* avoid circular failure */
  }
}
