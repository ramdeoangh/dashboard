import axios from 'axios';
import { apiBaseURL } from '../config.js';
import { clearStoredRefreshToken, getStoredRefreshToken } from './refreshStorage.js';

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    const rt = getStoredRefreshToken();
    const body = rt ? { refreshToken: rt } : {};
    refreshPromise = axios
      .post(`${apiBaseURL}/auth/refresh`, body, { withCredentials: true })
      .then((res) => {
        const t = res.data?.data?.accessToken;
        if (t) setAccessToken(t);
        return res.data?.data;
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setAccessToken(null);
          clearStoredRefreshToken();
          return null;
        }
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from './refreshStorage.js';

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        const data = await refreshAccessToken();
        if (data?.accessToken) {
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        setAccessToken(null);
        clearStoredRefreshToken();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
