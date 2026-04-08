/**
 * API and uploads base URLs — single source for the app (no .env required for production).
 * Change these constants when you deploy (e.g. same-origin `/api` or your public API host).
 */

//local
// const API_BASE_URL = 'http://localhost:4000/api';
// const UPLOADS_BASE_URL = 'http://localhost:4000/uploads';

//production
const API_BASE_URL = 'https://api.y4d.ngo/api';
const UPLOADS_BASE_URL = 'https://api.y4d.ngo/uploads';

function normalizeApiBase(url) {
  const u = String(url).trim();
  if (u === '') return '/api';
  return u.replace(/\/+$/, '') || '/api';
}

function normalizeUploadsBase(url) {
  const u = String(url).trim();
  if (u === '') return '/uploads';
  return u.replace(/\/+$/, '') || '/uploads';
}

/** Axios baseURL (include `/api` path when using path-style mounting). */
export const apiBaseURL = normalizeApiBase(API_BASE_URL);

/** Public URL prefix for uploaded static files (no trailing slash). */
export const uploadsBaseURL = normalizeUploadsBase(UPLOADS_BASE_URL);

/**
 * @param {string | null | undefined} relativePath — path as stored (may include leading slashes)
 * @returns {string | null}
 */
export function uploadsUrl(relativePath) {
  if (relativePath == null || relativePath === '') return null;
  const p = String(relativePath).replace(/^\/+/, '');
  return `${uploadsBaseURL}/${p}`;
}
