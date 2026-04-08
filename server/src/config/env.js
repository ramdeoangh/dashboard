import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Match migrate/seed: .env wins over inherited shell variables (e.g. DATABASE_NAME).
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

function req(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

/** Normalize origin for CORS comparison (no trailing path slash on origin). */
function normalizeOriginString(s) {
  const t = s.trim();
  if (!t) return '';
  try {
    return new URL(t).origin;
  } catch {
    return t.replace(/\/$/, '');
  }
}

/** Comma-separated CLIENT_ORIGIN values (e.g. production dashboard + local Vite). */
function parseClientOrigins(raw) {
  return raw
    .split(',')
    .map((s) => normalizeOriginString(s))
    .filter(Boolean);
}

const clientOrigins = parseClientOrigins(
  process.env.CLIENT_ORIGIN || 'http://localhost:5173'
);

const REFRESH_SAMESITE = new Set(['strict', 'lax', 'none']);

/**
 * True when the browser UI (first CLIENT_ORIGIN) is on a different host than PUBLIC_API_URL.
 * In that case the refresh cookie must be SameSite=None (+ Secure), even if NODE_ENV was
 * accidentally left as "development" (e.g. a deployed .env overriding the host panel).
 */
function inferSpaOnDifferentHostThanApi() {
  const apiRaw = process.env.PUBLIC_API_URL?.trim();
  if (!apiRaw || clientOrigins.length === 0) return false;
  try {
    const apiUrl = apiRaw.includes('://') ? apiRaw : `https://${apiRaw}`;
    const apiHost = new URL(apiUrl).hostname;
    const clientHost = new URL(clientOrigins[0]).hostname;
    return apiHost !== clientHost;
  } catch {
    return false;
  }
}

function resolveRefreshCookieSameSite() {
  const raw = (process.env.REFRESH_COOKIE_SAMESITE || '').toLowerCase();
  if (REFRESH_SAMESITE.has(raw)) return raw;
  if (inferSpaOnDifferentHostThanApi()) return 'none';
  return (process.env.NODE_ENV || 'development') === 'production' ? 'none' : 'lax';
}

const refreshCookieSameSite = resolveRefreshCookieSameSite();
const refreshCookieSecure =
  refreshCookieSameSite === 'none' ? true : process.env.NODE_ENV === 'production';

/**
 * Return refreshToken in login JSON + accept body on refresh/logout when:
 * - UI host ≠ PUBLIC_API_URL host (infer), or
 * - ALLOW_REFRESH_TOKEN_BODY=true, or
 * - production and PUBLIC_API_URL is unset (many hosts omit it; cookies are still third-party blocked).
 */
const refreshTokenAllowBodyAuth =
  inferSpaOnDifferentHostThanApi() ||
  process.env.ALLOW_REFRESH_TOKEN_BODY === 'true' ||
  ((process.env.NODE_ENV || 'development') === 'production' &&
    !(process.env.PUBLIC_API_URL || '').trim() &&
    process.env.DISALLOW_REFRESH_TOKEN_BODY !== 'true');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  /** All allowed CORS origins */
  clientOrigins,
  /** First origin (legacy / defaults) */
  clientOrigin: clientOrigins[0] || 'http://localhost:5173',
  /** Optional absolute API base for OpenAPI "Servers" (no trailing slash). */
  publicApiUrl: process.env.PUBLIC_API_URL?.trim().replace(/\/$/, '') || '',
  /** If set in production, Swagger accepts `X-API-Docs-Token` matching this value (JWT still works). */
  swaggerDocsToken: process.env.SWAGGER_DOCS_TOKEN?.trim() || '',
  /** Refresh cookie SameSite: default production `none` for SPA on a different host than the API. */
  refreshCookieSameSite,
  /** `true` whenever SameSite is `none` (required) or in production otherwise. */
  refreshCookieSecure,
  /** Cross-host SPA: login includes refreshToken in JSON; refresh/logout accept body.refreshToken. */
  refreshTokenAllowBodyAuth,
  db: {
    host: req('DATABASE_HOST', '127.0.0.1'),
    port: Number(process.env.DATABASE_PORT || 3306),
    user: req('DATABASE_USER', 'root'),
    password: process.env.DATABASE_PASSWORD || '',
    database: req('DATABASE_NAME', 'project_reporting'),
  },
  jwt: {
    accessSecret: req('JWT_ACCESS_SECRET', 'dev_access_secret_change_me_min_32_characters_long'),
    refreshSecret: req('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me_min_32_chars_long__'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7),
  },
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5),
  /** Persist HTTP access rows to application_logs (off by default; table is for errors only) */
  logHttpToDb: process.env.LOG_HTTP_TO_DB === 'true',
  /** Persist server errors (5xx) as structured JSON in application_logs.meta */
  logErrorsToDb: process.env.LOG_ERRORS_TO_DB !== 'false',
};
