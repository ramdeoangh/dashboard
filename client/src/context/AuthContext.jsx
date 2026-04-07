import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { refreshAccessToken, setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async (token) => {
    if (token) setAccessToken(token);
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
  }, []);

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
    const { accessToken, user: u } = data.data;
    setAccessToken(accessToken);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
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
