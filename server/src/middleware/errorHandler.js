import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { writeApplicationLog } from '../services/dbLogService.js';

export class AppError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'File too large' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: err.message || 'Upload error' });
  }

  const status = err.statusCode || 500;
  const message =
    status === 500 && env.isProd ? 'Internal server error' : err.message || 'Error';

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path });
    if (env.logErrorsToDb) {
      req.skipHttpAuditDb = true;
      void writeApplicationLog({
        correlationId: req.correlationId,
        level: 'error',
        message: err.message?.slice(0, 1000) || 'Server error',
        meta: {
          stack: env.isProd ? undefined : err.stack,
          name: err.name,
          path: req.originalUrl || req.url,
        },
        method: req.method,
        path: (req.originalUrl || req.url || '').slice(0, 500),
        statusCode: status,
        userId: req.auth?.userId ?? null,
        ip: req.ip,
        userAgent: req.get('user-agent') || null,
      });
    }
  } else {
    logger.warn(err.message, { path: req.path });
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(env.isProd ? {} : { details: err.details }),
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
