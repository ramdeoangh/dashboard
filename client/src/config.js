/**
 * Build-time config from Vite env (VITE_*). See client/.env.example.
 * If a variable is missing, empty, or whitespace-only, the hardcoded default is used.
 */

const DEFAULT_API_BASE_URL = '/api';
const DEFAULT_UPLOADS_BASE_URL = '/uploads';

function normalizeApiBase(url) {
  if (url == null) return DEFAULT_API_BASE_URL;
  const u = String(url).trim();
  if (u === '') return DEFAULT_API_BASE_URL;
  return u.replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
}

function normalizeUploadsBase(url) {
  if (url == null) return DEFAULT_UPLOADS_BASE_URL;
  const u = String(url).trim();
  if (u === '') return DEFAULT_UPLOADS_BASE_URL;
  return u.replace(/\/+$/, '') || DEFAULT_UPLOADS_BASE_URL;
}

/** Axios baseURL (include `/api` path segment). */
export const apiBaseURL = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

/** Public URL prefix for uploaded static files (no trailing slash). */
export const uploadsBaseURL = normalizeUploadsBase(import.meta.env.VITE_UPLOADS_BASE_URL);

/**
 * @param {string | null | undefined} relativePath — path as stored (may include leading slashes)
 * @returns {string | null}
 */
export function uploadsUrl(relativePath) {
  if (relativePath == null || relativePath === '') return null;
  const p = String(relativePath).replace(/^\/+/, '');
  return `${uploadsBaseURL}/${p}`;
}
