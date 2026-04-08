import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

/** Public URL prefix for files under upload dir */
export const UPLOAD_PUBLIC_PREFIX = '/uploads';

/**
 * Public URL for a file stored relative to the upload dir (e.g. `2/before/abc.jpg`).
 * When PUBLIC_API_URL is set (e.g. https://api.example.com), returns an absolute URL so
 * SPAs on another origin can load images without a broken relative `/uploads/...` path.
 */
export function toPublicUrl(relativePath) {
  if (!relativePath) return null;
  const clean = String(relativePath).replace(/^\/+/, '').replace(/\.\./g, '');
  const pathFromRoot = `${UPLOAD_PUBLIC_PREFIX}/${clean}`;
  const base = env.publicApiUrl?.trim().replace(/\/$/, '');
  if (base) {
    return `${base}${pathFromRoot}`;
  }
  return pathFromRoot;
}

export function absoluteUploadPath(relativePath) {
  if (!relativePath) return null;
  const clean = String(relativePath).replace(/^\/+/, '').replace(/\.\./g, '');
  return path.join(env.uploadDir, clean);
}

export function safeUnlink(relativePath) {
  const abs = absoluteUploadPath(relativePath);
  if (!abs || !abs.startsWith(path.resolve(env.uploadDir))) return;
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

export function relativeFromMulter(file) {
  if (!file) return null;
  const full = path.resolve(file.path);
  const root = path.resolve(env.uploadDir);
  if (!full.startsWith(root)) return null;
  return path.relative(root, full).split(path.sep).join('/');
}
