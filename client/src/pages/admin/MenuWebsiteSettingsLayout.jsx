import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `nav-pill ${isActive ? 'nav-pill-active' : ''}`;

export default function MenuWebsiteSettingsLayout() {
  return (
    <div>
      <h1 className="page-title">Menu Website setting - web settings</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Manage admin sidebar structure. Grant which roles see each item under <strong>Roles → Menu Role</strong>. Inactive items are
        hidden from the sidebar.
      </p>
      <nav className="menu-website-subnav" aria-label="Menu Website setting - web settings">
        <NavLink to="add-menu" className={linkClass} end>
          Add Menu
        </NavLink>
        <NavLink to="add-submenu" className={linkClass}>
          Add Submenu
        </NavLink>
      </nav>
      <Outlet />
      <style>{`
        .menu-website-subnav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .nav-pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          color: var(--navy);
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        .nav-pill:hover {
          border-color: var(--teal);
          color: var(--teal);
        }
        .nav-pill-active {
          background: var(--teal-light);
          border-color: var(--teal);
          color: var(--navy);
        }
      `}</style>
    </div>
  );
}
