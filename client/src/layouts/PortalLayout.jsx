import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import ProfileMenu from '../components/ProfileMenu.jsx';

export default function PortalLayout() {
  const { user, ready, logout, isAdminNav } = useAuth();
  const [portalName, setPortalName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/portal/bootstrap');
        if (!cancelled) setPortalName(data.data?.portalName || 'Portal');
      } catch {
        if (!cancelled) setPortalName('Portal');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="portal-root">
      <header className="topnav">
        <div className="nav-brand">
          <div className="nav-logo">PR</div>
          <div className="nav-title">
            <span>{portalName || '…'}</span>
          </div>
        </div>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          {isAdminNav && (
            <Link to="/admin" className="admin-link">
              Admin
            </Link>
          )}
        </nav>
        <div className="nav-right">
          {!ready ? null : user ? (
            <ProfileMenu onSignOut={() => logout()} variant="portal" />
          ) : (
            <Link to="/login" state={{ from: '/' }} className="btn btn-primary portal-login-btn">
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="portal-main">
        <Outlet />
      </main>
      <style>{`
        .portal-root { min-height: 100%; display: flex; flex-direction: column; }
        .topnav {
          background: var(--navy);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px; min-height: 52px; flex-wrap: wrap; gap: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          position: sticky; top: 0; z-index: 50;
        }
        .nav-brand { display: flex; align-items: center; gap: 12px; }
        .nav-logo {
          width: 36px; height: 36px; border-radius: 8px; background: var(--gold);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; color: var(--navy);
        }
        .nav-title span { color: var(--white); font-weight: 600; font-size: 15px; display: block; }
        .nav-title small { color: var(--teal-mid); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
        .nav-links { display: flex; gap: 16px; align-items: center; }
        .nav-links a { color: var(--teal-light); font-weight: 500; font-size: 14px; text-decoration: none; }
        .nav-links a:hover { color: var(--white); }
        .nav-links a.active { color: var(--gold); }
        .admin-link { color: var(--gold) !important; font-weight: 600 !important; }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .portal-login-btn {
          text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
          border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px; padding: 8px 14px;
        }
        .portal-main { flex: 1; padding: 20px; max-width: 1400px; margin: 0 auto; width: 100%; }
      `}</style>
    </div>
  );
}
