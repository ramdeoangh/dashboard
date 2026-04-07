import { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function menuIcon(iconSlug) {
  const map = {
    'layout-dashboard': '▣',
    settings: '⚙',
    folder: '📁',
    map: '🗺',
    briefcase: '💼',
    users: '👥',
  };
  return map[iconSlug] || '◆';
}

function NavSection({ menu }) {
  const [open, setOpen] = useState(true);
  const hasSubs = menu.submenus?.length > 0;
  const icon = menuIcon(menu.icon);
  const location = useLocation();

  if (hasSubs) {
    const childActive = menu.submenus.some((s) => location.pathname === s.path || location.pathname.startsWith(`${s.path}/`));
    return (
      <div className="nav-section">
        <button
          type="button"
          className={`nav-top toggle${childActive ? ' child-active' : ''}`}
          onClick={() => setOpen(!open)}
          title={menu.name}
        >
          <span className="nav-ico" aria-hidden>
            {icon}
          </span>
          <span className="nav-label">{menu.name}</span>
          <span className="chev nav-chev">{open ? '−' : '+'}</span>
        </button>
        {open && (
          <div className="nav-sub">
            {menu.submenus.map((s) => (
              <NavLink key={s.id} to={s.path} className={({ isActive }) => (isActive ? 'active' : '')} title={s.name}>
                <span className="nav-label">{s.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (menu.path && menu.path !== '#') {
    return (
      <div className="nav-section">
        <NavLink to={menu.path} className={({ isActive }) => `nav-top ${isActive ? 'active' : ''}`} title={menu.name}>
          <span className="nav-ico" aria-hidden>
            {icon}
          </span>
          <span className="nav-label">{menu.name}</span>
        </NavLink>
      </div>
    );
  }

  return null;
}

export default function AdminLayout() {
  const { user, logout, isAdminNav } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAdminNav) {
    return <Navigate to="/" replace />;
  }

  const nav = (user?.adminNav || []).filter((m) => m.slug !== 'dashboard');

  return (
    <div className="admin-root">
      <aside className={`admin-side ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="side-head">
          <strong className="side-title">
            <span className="nav-label">Admin</span>
            <span className="side-monogram" aria-hidden>
              A
            </span>
          </strong>
          <div className="side-head-actions">
            <Link to="/" className="icon-link" aria-label="Open portal" title="Portal">
              <span aria-hidden>🌐</span>
            </Link>
            <button type="button" className="icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              ☰
            </button>
          </div>
        </div>
        <nav className="side-nav">
          <NavLink to="/admin" end className={({ isActive }) => `nav-top ${isActive ? 'active' : ''}`} title="Dashboard">
            <span className="nav-ico" aria-hidden>
              ▣
            </span>
            <span className="nav-label">Dashboard</span>
          </NavLink>
          {nav.map((m) => (
            <NavSection key={m.id} menu={m} />
          ))}
        </nav>
        <div className="side-foot">
          <Link to="/" title="Portal">
            <span className="nav-ico" aria-hidden>
              ←
            </span>
            <span className="nav-label">Portal</span>
          </Link>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-top">
          <span className="muted">{user?.displayName || user?.username}</span>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Sign out
          </button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
      <style>{`
        .admin-root { display: flex; min-height: 100vh; }
        .admin-side {
          width: 260px; background: var(--white); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; flex-shrink: 0;
          transition: width 0.2s;
        }
        .admin-side.collapsed { width: 56px; }
        .admin-side.collapsed .nav-sub { display: none !important; }
        .admin-side.collapsed .nav-label,
        .admin-side.collapsed .nav-chev,
        .admin-side.collapsed .side-title .nav-label { display: none; }
        .admin-side.collapsed .side-title .side-monogram { display: flex; }
        .admin-side .side-title .side-monogram { display: none; }
        .side-head {
          padding: 12px 10px; background: var(--navy); color: var(--white);
          display: flex; justify-content: space-between; align-items: center; gap: 8px;
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .side-head-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .admin-side.collapsed .side-head {
          flex-direction: column; justify-content: center; padding: 10px 8px; gap: 10px;
        }
        .admin-side.collapsed .side-head-actions { flex-direction: column; gap: 8px; }
        .icon-btn, .icon-link {
          background: transparent; border: none; color: var(--white); font-size: 18px;
          line-height: 1; padding: 4px; cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .side-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; }
        .nav-section { border-bottom: 1px solid var(--gray-light); }
        .nav-top {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; font-weight: 600; font-size: 13px; color: var(--navy);
          text-decoration: none; border: none; width: 100%; text-align: left; background: none;
          box-sizing: border-box;
        }
        .nav-ico { flex-shrink: 0; width: 1.25em; text-align: center; font-size: 15px; }
        .nav-top.toggle { cursor: pointer; justify-content: flex-start; }
        .nav-top.toggle .nav-label { flex: 1; }
        .nav-top.active, .side-nav .nav-sub a.active {
          background: var(--teal-light); border-left: 4px solid var(--teal); padding-left: 10px;
        }
        .nav-top.toggle.child-active { background: rgba(0, 105, 120, 0.08); }
        .nav-sub a {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px 8px 22px; font-size: 13px; color: var(--gray-text); text-decoration: none;
        }
        .nav-sub a.active { color: var(--navy); font-weight: 600; }
        .side-foot { padding: 10px 14px; border-top: 1px solid var(--border); font-size: 12px; }
        .side-foot a {
          display: flex; align-items: center; gap: 10px; color: var(--navy); text-decoration: none; font-weight: 600;
        }
        .admin-side.collapsed .nav-top,
        .admin-side.collapsed .nav-top.toggle {
          justify-content: center; padding-left: 8px; padding-right: 8px; gap: 0;
        }
        .admin-side.collapsed .nav-top.active,
        .admin-side.collapsed .side-nav .nav-sub a.active {
          padding-left: 8px; border-left: none;
          box-shadow: inset 3px 0 0 var(--teal);
        }
        .admin-side.collapsed .side-foot a { justify-content: center; padding: 8px 0; }
        .admin-body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .admin-top {
          display: flex; justify-content: flex-end; align-items: center; gap: 12px;
          padding: 12px 20px; background: var(--white); border-bottom: 1px solid var(--border);
        }
        .admin-content { padding: 20px; flex: 1; background: var(--off-white); }
        .chev { opacity: 0.7; font-size: 14px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
