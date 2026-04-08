/** sessionStorage fallback when refresh cookie cannot cross site boundaries (Chrome / third-party cookies). */
const KEY = 'pr_refresh_jwt';

export function getStoredRefreshToken() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token) {
  try {
    if (token) sessionStorage.setItem(KEY, token);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode, etc. */
  }
}

export function clearStoredRefreshToken() {
  setStoredRefreshToken(null);
}
