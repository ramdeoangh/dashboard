import { AppError } from './errorHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

/**
 * Attaches req.auth if Authorization Bearer is valid.
 */
export function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return next();
  const token = h.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    const pid = decoded.partnerId;
    const partnerId =
      pid != null && pid !== '' && Number.isFinite(Number(pid)) && Number(pid) > 0 ? Number(pid) : null;
    req.auth = {
      userId: decoded.sub,
      username: decoded.username,
      displayName: decoded.displayName,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      partnerId,
    };
  } catch {
    /* ignore */
  }
  next();
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }
  const token = h.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    const pid = decoded.partnerId;
    const partnerId =
      pid != null && pid !== '' && Number.isFinite(Number(pid)) && Number(pid) > 0 ? Number(pid) : null;
    req.auth = {
      userId: decoded.sub,
      username: decoded.username,
      displayName: decoded.displayName,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      partnerId,
    };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
}

/** User must have at least one of the listed permissions */
export function requirePermission(...slugs) {
  return (req, res, next) => {
    if (!req.auth) return next(new AppError(401, 'Authentication required'));
    const set = new Set(req.auth.permissions || []);
    const ok = slugs.some((s) => set.has(s));
    if (!ok) return next(new AppError(403, 'Insufficient permissions'));
    next();
  };
}
