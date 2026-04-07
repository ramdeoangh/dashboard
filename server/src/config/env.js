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

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  clientOrigin: req('CLIENT_ORIGIN', 'http://localhost:5173'),
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
  /** Persist one row per /api request (except health) to application_logs */
  logHttpToDb: process.env.LOG_HTTP_TO_DB !== 'false',
  /** Persist server errors (5xx + stacks) to application_logs (avoids duplicate HTTP row) */
  logErrorsToDb: process.env.LOG_ERRORS_TO_DB !== 'false',
};
