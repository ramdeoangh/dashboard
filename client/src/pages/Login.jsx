import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function postLoginPath(from, u) {
  if (from?.startsWith('/admin')) return from;
  if (u?.adminNav?.length) return '/admin';
  return from || '/';
}

export default function Login() {
  const { login, user, ready } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  if (ready && user) {
    return <Navigate to={postLoginPath(from, user)} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(username, password);
      navigate(postLoginPath(from, u), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1 className="page-title">Sign in</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Project reporting portal
        </p>
        <form onSubmit={onSubmit} className="form-grid" style={{ maxWidth: '100%' }}>
          <label>
            Username or email
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <style>{`
        .login-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 24px; background: linear-gradient(160deg, var(--navy-dark), var(--navy-mid));
        }
        .login-card { max-width: 400px; width: 100%; }
      `}</style>
    </div>
  );
}
