import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  refreshAccessToken,
  setAccessToken,
  setStoredRefreshToken,
} from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async (token) => {
    if (token) setAccessToken(token);
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
  }, []);

  // Try to restore session from httpOnly refresh cookie (POST /auth/refresh). Runs on every full load,
  // including /login — 401 there simply means "not logged in yet"; not a custom-header issue.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await refreshAccessToken();
        if (cancelled) return;
        if (data?.accessToken && data?.user) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        } else if (data?.accessToken) {
          setAccessToken(data.accessToken);
          await loadMe(data.accessToken);
        }
      } catch {
        setAccessToken(null);
        setUser(null);
        clearStoredRefreshToken();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    const { accessToken, user: u, refreshToken } = data.data;
    if (refreshToken) setStoredRefreshToken(refreshToken);
    setAccessToken(accessToken);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      const rt = getStoredRefreshToken();
      await api.post('/auth/logout', rt ? { refreshToken: rt } : {});
    } finally {
      clearStoredRefreshToken();
      setAccessToken(null);
      setUser(null);
    }
  };

  const hasPermission = useCallback(
    (slug) => {
      return Boolean(user?.permissions?.includes(slug));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      logout,
      loadMe,
      hasPermission,
      isAdminNav: Boolean(user?.adminNav?.length),
    }),
    [user, ready, loadMe, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
