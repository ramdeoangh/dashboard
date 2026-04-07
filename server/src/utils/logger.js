import { env } from '../config/env.js';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = env.isProd ? levels.info : levels.debug;

function ts() {
  return new Date().toISOString();
}

export const logger = {
  error(msg, meta) {
    if (current >= levels.error) console.error(ts(), '[ERROR]', msg, meta ?? '');
  },
  warn(msg, meta) {
    if (current >= levels.warn) console.warn(ts(), '[WARN]', msg, meta ?? '');
  },
  info(msg, meta) {
    if (current >= levels.info) console.log(ts(), '[INFO]', msg, meta ?? '');
  },
  debug(msg, meta) {
    if (current >= levels.debug) console.log(ts(), '[DEBUG]', msg, meta ?? '');
  },
};
