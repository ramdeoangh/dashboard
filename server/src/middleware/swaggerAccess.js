import crypto from 'crypto';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/tokens.js';

const DOCS_COOKIE = 'api_docs_token';

function timingSafeTokenEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function bearerValid(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return false;
  try {
    verifyAccessToken(h.slice(7));
    return true;
  } catch {
    return false;
  }
}

function docsCookieOpts() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/api',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

/**
 * Production: Swagger UI and OpenAPI JSON need a valid JWT Bearer, matching X-API-Docs-Token,
 * matching api_docs_token cookie (set via ?docs_token= once), or ?docs_token= on GET (sets cookie + redirect).
 * Development: no gate.
 */
export function requireSwaggerAccess(req, res, next) {
  if (!env.isProd) {
    return next();
  }

  const token = env.swaggerDocsToken;
  const bareUrl = req.originalUrl.split('?')[0];

  if (token && req.method === 'GET' && req.query.docs_token != null) {
    if (!timingSafeTokenEqual(String(req.query.docs_token), token)) {
      return res.status(403).type('text/plain').send('Invalid docs_token.');
    }
    res.cookie(DOCS_COOKIE, token, docsCookieOpts());
    if (bareUrl === '/api/openapi.json') {
      return next();
    }
    return res.redirect(302, bareUrl);
  }

  if (bearerValid(req)) {
    return next();
  }

  if (token && req.headers['x-api-docs-token'] && timingSafeTokenEqual(req.headers['x-api-docs-token'], token)) {
    return next();
  }

  if (token && req.cookies?.[DOCS_COOKIE] && timingSafeTokenEqual(req.cookies[DOCS_COOKIE], token)) {
    return next();
  }

  const proto = (req.get('x-forwarded-proto') || '').split(',')[0].trim() || req.protocol || 'https';
  const host = req.get('host') || '';
  const docsUrl = host ? `${proto}://${host}/api/docs/?docs_token=<SWAGGER_DOCS_TOKEN>` : '/api/docs/?docs_token=<SWAGGER_DOCS_TOKEN>';
  const hint =
    token != null && token !== ''
      ? `Browser (easiest): open once ${docsUrl} (use the real token from .env) — you are redirected here without the token in the URL; cookie lasts 8h. Or header X-API-Docs-Token, or Authorization: Bearer <accessToken>.`
      : 'Set SWAGGER_DOCS_TOKEN in .env and open /api/docs/?docs_token=… once, or use Authorization: Bearer <accessToken> (e.g. browser extension).';

  res
    .status(401)
    .type('text/plain')
    .send(
      `API documentation requires authentication in production.\n\n${hint}\n\nHealth (no auth): GET /api/health, GET /api/health/db.`
    );
}
