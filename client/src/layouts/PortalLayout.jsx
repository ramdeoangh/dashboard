import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PortalLayout() {
  const { user, logout, isAdminNav } = useAuth();

  return (
    <div className="portal-root">
      <header className="topnav">
        <div className="nav-brand">
          <div className="nav-logo">PR</div>
          <div className="nav-title">
            <span>Project reporting</span>
            <small>Portal</small>
          </div>
        </div>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            Reports
          </NavLink>
          {isAdminNav && (
            <Link to="/admin" className="admin-link">
              Admin
            </Link>
          )}
        </nav>
        <div className="nav-right">
          <span className="user-pill">{user?.displayName || user?.username}</span>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Sign out
          </button>
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
        .user-pill { color: var(--teal-light); font-size: 13px; }
        .portal-main { flex: 1; padding: 20px; max-width: 1400px; margin: 0 auto; width: 100%; }
      `}</style>
    </div>
  );
}
