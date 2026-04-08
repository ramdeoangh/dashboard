import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { httpAuditLogger } from './middleware/httpAuditLogger.js';
import { UPLOAD_PUBLIC_PREFIX } from './utils/uploadPath.js';
import authRoutes from './routes/auth.routes.js';
import portalRoutes from './routes/portal.routes.js';
import adminRoutes from './routes/admin/index.js';
import { getPool } from './config/database.js';
import { mountSwagger } from './swaggerSetup.js';

const app = express();

app.set('trust proxy', 1);

const helmetDefault = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});
const helmetDocs = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
});

app.use((req, res, next) => {
  if (req.path === '/api/openapi.json' || req.path.startsWith('/api/docs')) {
    return helmetDocs(req, res, next);
  }
  helmetDefault(req, res, next);
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      try {
        const normalized = new URL(origin).origin;
        if (env.clientOrigins.includes(normalized)) {
          return callback(null, true);
        }
      } catch {
        /* ignore */
      }
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(httpAuditLogger);

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

app.use(
  UPLOAD_PUBLIC_PREFIX,
  express.static(env.uploadDir, {
    fallthrough: false,
    maxAge: env.isProd ? '7d' : 0,
  })
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({
      ok: false,
      database: 'unavailable',
      error: env.isProd ? undefined : err.message,
    });
  }
});

mountSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorHandler);

export default app;
