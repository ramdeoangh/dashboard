import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toastError, toastSuccess } from '../toastBus.js';
import { postLoginNavigatePath } from '../utils/authPaths.js';

export default function Login() {
  const { login, user, ready } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = typeof location.state?.from === 'string' ? location.state.from : '';

  if (ready && user) {
    return <Navigate to={postLoginNavigatePath(from, user)} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(username, password);
      toastSuccess('Signed in.');
      navigate(postLoginNavigatePath(from, u), { replace: true });
    } catch (err) {
      toastError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <aside className="login-brand" aria-label="Product overview">
        <div className="login-brand__mesh" />
        <div className="login-brand__orb login-brand__orb--1" />
        <div className="login-brand__orb login-brand__orb--2" />
        <div className="login-brand__orb login-brand__orb--3" />
        <div className="login-brand__content">
          <p className="login-brand__eyebrow">Project reporting</p>
          <h2 className="login-brand__title">
            Track projects,
            <br />
            measure impact
          </h2>
          <p className="login-brand__lede">
            Coordinate field work, partners, and outcomes in one secure workspace built for transparency and speed.
          </p>
          <ul className="login-brand__list">
            <li>Partner and admin workflows</li>
            <li>Photos, status, and submissions</li>
            <li>Role-based access</li>
          </ul>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-card card">
          <h1 className="page-title">Sign in</h1>
          <p className="muted login-card__subtitle">Use your organisation credentials to continue.</p>
          <form onSubmit={onSubmit} className="form-grid login-form" style={{ maxWidth: '100%' }}>
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
            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>

      <style>{`
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          grid-template-rows: 1fr;
        }

        .login-brand {
          position: relative;
          overflow: hidden;
          padding: clamp(32px, 5vw, 56px);
          display: flex;
          align-items: flex-end;
          color: var(--white);
          background: linear-gradient(145deg, #0d1f3d 0%, var(--navy-dark) 38%, var(--navy-mid) 100%);
        }

        .login-brand__mesh {
          position: absolute;
          inset: 0;
          opacity: 0.45;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(44, 198, 210, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(251, 179, 33, 0.2) 0%, transparent 40%),
            linear-gradient(
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            );
          background-size: auto, auto, 48px 48px, 48px 48px;
        }

        .login-brand__orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(0.5px);
        }

        .login-brand__orb--1 {
          width: min(420px, 55vw);
          height: min(420px, 55vw);
          top: -18%;
          right: -12%;
          background: radial-gradient(circle at 35% 35%, rgba(44, 198, 210, 0.55), rgba(27, 58, 107, 0.15) 70%);
          opacity: 0.9;
        }

        .login-brand__orb--2 {
          width: min(280px, 40vw);
          height: min(280px, 40vw);
          bottom: 8%;
          left: -8%;
          background: radial-gradient(circle at 60% 40%, rgba(251, 179, 33, 0.35), transparent 65%);
          opacity: 0.85;
        }

        .login-brand__orb--3 {
          width: min(180px, 28vw);
          height: min(180px, 28vw);
          top: 42%;
          left: 28%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 70%);
        }

        .login-brand__content {
          position: relative;
          z-index: 1;
          max-width: 420px;
        }

        .login-brand__eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--teal-light);
          opacity: 0.95;
        }

        .login-brand__title {
          margin: 0 0 16px;
          font-size: clamp(1.75rem, 3.2vw, 2.35rem);
          font-weight: 700;
          line-height: 1.15;
          color: var(--white);
          letter-spacing: -0.02em;
        }

        .login-brand__lede {
          margin: 0 0 24px;
          font-size: 15px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.82);
          max-width: 38ch;
        }

        .login-brand__list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.88);
        }

        .login-brand__list li {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-brand__list li::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 0 3px rgba(251, 179, 33, 0.25);
          flex-shrink: 0;
        }

        .login-main {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(24px, 4vw, 48px);
          background: var(--off-white);
          border-left: 1px solid var(--border);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: clamp(20px, 3vw, 28px);
          box-shadow: 0 8px 32px rgba(27, 58, 107, 0.1);
        }

        .login-card__subtitle {
          margin: 0 0 22px;
          font-size: 14px;
        }

        .login-form {
          gap: 14px;
        }

        .login-submit {
          margin-top: 4px;
          padding: 11px 18px;
          font-size: 14px;
        }

        @media (max-width: 880px) {
          .login-shell {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }

          .login-brand {
            align-items: center;
            min-height: min(42vh, 320px);
            padding: 32px 24px 28px;
          }

          .login-brand__content {
            max-width: 520px;
          }

          .login-brand__orb--1 {
            top: -25%;
            right: -20%;
          }

          .login-main {
            border-left: none;
            border-top: 1px solid var(--border);
            align-items: flex-start;
            padding-top: 28px;
            padding-bottom: 40px;
          }
        }
      `}</style>
    </div>
  );
}
