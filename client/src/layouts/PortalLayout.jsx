import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { mediaUrlFromApi } from '../config.js';
import ProfileMenu from '../components/ProfileMenu.jsx';

export default function PortalLayout() {
  const { user, ready, logout, isAdminNav } = useAuth();
  const [boot, setBoot] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/portal/bootstrap');
        if (!cancelled) setBoot(data.data || null);
      } catch {
        if (!cancelled) setBoot(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const displayTitle =
    user?.partnerId && user?.partnerName ? user.partnerName : boot?.portalName || 'Portal';
  const tagline = boot?.navTitle || 'Project Report';
  const logoSrc = boot?.headerLogoUrl ? mediaUrlFromApi(boot.headerLogoUrl) : null;

  return (
    <div className="portal-root">
      <header className="topnav">
        <div className="nav-brand">
          <div className="nav-logo">
            {logoSrc ? <img src={logoSrc} alt="" /> : 'PR'}
          </div>
          <div className="nav-title">
            <span>{displayTitle}</span>
          </div>
        </div>
        <span className="portal-nav-tagline">{tagline}</span>
        <div className="nav-right">
          {isAdminNav && (
            <Link to="/admin" className="admin-link">
              Admin
            </Link>
          )}
          {!ready ? null : user ? (
            <ProfileMenu onSignOut={() => logout()} variant="portal" />
          ) : null}
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
          padding: 0 20px; min-height: 52px; flex-wrap: wrap; gap: 8px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          position: sticky; top: 0; z-index: 50;
        }
        .nav-brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .nav-logo {
          width: 36px; height: 36px; border-radius: 8px; background: var(--gold);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; color: var(--navy);
          overflow: hidden; flex-shrink: 0;
        }
        .nav-logo img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .nav-title span { color: var(--white); font-weight: 600; font-size: 15px; display: block; }
        .portal-nav-tagline {
          flex: 1;
          text-align: center;
          color: var(--teal-light);
          font-weight: 500;
          font-size: 14px;
          min-width: 120px;
        }
        .nav-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .admin-link {
          color: var(--gold);
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
        }
        .admin-link:hover { color: var(--white); }
        .portal-main { flex: 1; padding: 20px; max-width: 1400px; margin: 0 auto; width: 100%; }
      `}</style>
    </div>
  );
}
