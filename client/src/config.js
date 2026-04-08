/**
 * Build-time config from Vite env (VITE_*). See client/.env.example.
 */

function normalizeApiBase(url) {
  const u = (url ?? '/api').trim();
  return u === '' ? '/api' : u.replace(/\/+$/, '') || '/api';
}

function normalizeUploadsBase(url) {
  const u = (url ?? '/uploads').trim();
  return u === '' ? '/uploads' : u.replace(/\/+$/, '') || '/uploads';
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
