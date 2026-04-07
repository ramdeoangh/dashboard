import { useEffect, useRef, useState } from 'react';

/**
 * Three-dot row actions dropdown; closes on outside click and Escape.
 */
export default function RowActionsMenu({ id, items }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="row-actions" ref={wrapRef}>
      <button
        type="button"
        className="row-actions__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Actions for row ${id}`}
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>
      {open && (
        <div className="row-actions__menu" role="menu">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`row-actions__item${item.danger ? ' row-actions__item--danger' : ''}`}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        .row-actions { position: relative; display: inline-block; }
        .row-actions__trigger {
          width: 32px; height: 32px; padding: 0; border-radius: 6px;
          border: 1px solid var(--border); background: var(--white); color: var(--navy);
          font-size: 18px; line-height: 1; cursor: pointer; font-weight: 700;
        }
        .row-actions__trigger:hover { background: var(--gray-light); }
        .row-actions__menu {
          position: absolute; right: 0; top: 100%; margin-top: 4px; z-index: 40;
          min-width: 160px; background: var(--white); border: 1px solid var(--border);
          border-radius: 8px; box-shadow: var(--shadow); padding: 4px 0;
        }
        .row-actions__item {
          display: block; width: 100%; text-align: left; padding: 8px 14px;
          border: none; background: none; font-size: 13px; cursor: pointer; color: var(--text-dark);
        }
        .row-actions__item:hover { background: var(--teal-light); }
        .row-actions__item--danger { color: var(--danger); }
      `}</style>
    </div>
  );
}
