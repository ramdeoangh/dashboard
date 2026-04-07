import { useEffect, useRef, useState } from 'react';

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function ProfileMenu({ prefix, onSignOut, variant = 'admin' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  const mod = variant === 'portal' ? 'portal' : 'admin';
  const hasPrefix = Boolean(prefix);
  const ariaLabel = hasPrefix ? `${prefix} account menu` : 'Account menu';

  return (
    <div className={`profile-menu profile-menu--${mod}`} ref={wrapRef}>
      <button
        type="button"
        className={`profile-menu-trigger${hasPrefix ? ' profile-menu-trigger--with-prefix' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={ariaLabel}
      >
        {hasPrefix ? (
          <span className="profile-menu-prefix" aria-hidden>
            {prefix}
          </span>
        ) : null}
        <span className="profile-menu-icon">
          <UserIcon />
        </span>
      </button>
      {open && (
        <div className="profile-menu-dropdown" role="menu">
          <button type="button" className="profile-menu-item" role="menuitem" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
      <style>{`
        .profile-menu { position: relative; flex-shrink: 0; }
        .profile-menu-trigger {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; padding: 0; border-radius: 50%; cursor: pointer;
          background: transparent; border: 1px solid var(--profile-trigger-border, var(--border));
          color: var(--profile-trigger-fg, var(--navy));
        }
        .profile-menu-trigger--with-prefix {
          width: auto; min-height: 40px; padding: 0 12px 0 14px; gap: 10px;
          border-radius: 999px; justify-content: flex-start;
        }
        .profile-menu-prefix {
          font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: inherit;
        }
        .profile-menu-trigger:hover { background: var(--profile-trigger-hover, var(--gray-light)); }
        .profile-menu-trigger:focus-visible {
          outline: 2px solid var(--teal); outline-offset: 2px;
        }
        .profile-menu-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .profile-menu-dropdown {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
          min-width: 140px; padding: 6px 0; margin: 0;
          background: var(--white); border: 1px solid var(--border);
          border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .profile-menu-item {
          display: block; width: 100%; margin: 0; padding: 10px 14px; text-align: left;
          font-size: 13px; font-weight: 500; color: var(--gray-text);
          background: none; border: none; cursor: pointer;
        }
        .profile-menu-item:hover { background: var(--gray-light); color: var(--navy); }
        .profile-menu--portal {
          --profile-trigger-border: rgba(255, 255, 255, 0.45);
          --profile-trigger-fg: var(--white);
          --profile-trigger-hover: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}
