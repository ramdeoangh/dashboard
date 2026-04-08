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
