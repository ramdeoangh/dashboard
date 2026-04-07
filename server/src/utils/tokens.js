import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
    issuer: 'project-reporting',
    audience: 'portal',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret, {
    issuer: 'project-reporting',
    audience: 'portal',
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: `${env.jwt.refreshExpiresDays}d`,
    issuer: 'project-reporting',
    audience: 'refresh',
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, {
    issuer: 'project-reporting',
    audience: 'refresh',
  });
}

export function newRefreshRaw() {
  return uuidv4() + uuidv4();
}
