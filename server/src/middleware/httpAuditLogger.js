import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { writeApplicationLog } from '../services/dbLogService.js';

const SKIP_PATHS = new Set(['/api/health']);

/**
 * Assigns correlation id, then on response finish writes one HTTP audit row (async).
 * Skips when LOG_HTTP_TO_DB=false or path is excluded.
 */
export function httpAuditLogger(req, res, next) {
  const incoming = req.headers['x-correlation-id'];
  req.correlationId = typeof incoming === 'string' && incoming.length <= 64 ? incoming.slice(0, 36) : randomUUID();
  res.setHeader('X-Correlation-Id', req.correlationId);

  if (!env.logHttpToDb) {
    return next();
  }

  const start = Date.now();
  res.on('finish', () => {
    try {
      const url = req.originalUrl || req.url || '';
      if (!url.startsWith('/api')) return;
      if (SKIP_PATHS.has(url.split('?')[0])) return;
      if (req.skipHttpAuditDb) return;

      const duration = Date.now() - start;
      void writeApplicationLog({
        correlationId: req.correlationId,
        level: 'http',
        message: `${req.method} ${url.split('?')[0]} ${res.statusCode}`,
        meta: { duration_ms: duration },
        method: req.method,
        path: url.slice(0, 500),
        statusCode: res.statusCode,
        durationMs: duration,
        userId: req.auth?.userId ?? null,
        ip: req.ip,
        userAgent: req.get('user-agent') || null,
      });
    } catch {
      /* ignore */
    }
  });

  next();
}
