import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/tokens.js';

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

/**
 * Production: Swagger UI and OpenAPI JSON require a valid JWT Bearer or matching X-API-Docs-Token (if SWAGGER_DOCS_TOKEN is set).
 * Development: no gate (use CLIENT_ORIGIN + localhost as needed for CORS).
 */
export function requireSwaggerAccess(req, res, next) {
  if (!env.isProd) {
    return next();
  }
  if (bearerValid(req)) {
    return next();
  }
  if (env.swaggerDocsToken && req.headers['x-api-docs-token'] === env.swaggerDocsToken) {
    return next();
  }
  res
    .status(401)
    .type('text/plain')
    .send(
      'API documentation requires authentication in production. Use Authorization: Bearer <accessToken> (from POST /api/auth/login), or set SWAGGER_DOCS_TOKEN in .env and send header X-API-Docs-Token with that value. Health endpoints stay public: GET /api/health, GET /api/health/db.'
    );
}
