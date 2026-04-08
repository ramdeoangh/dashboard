import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.port, () => {
  logger.info(`API listening on port ${env.port}`, {
    env: env.nodeEnv,
    refreshCookieSameSite: env.refreshCookieSameSite,
    refreshCookieSecure: env.refreshCookieSecure,
    refreshTokenAllowBodyAuth: env.refreshTokenAllowBodyAuth,
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});
