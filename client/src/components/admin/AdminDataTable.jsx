/**
 * Card-wrapped table with MSD-style compact density (theme vars only).
 */
export default function AdminDataTable({ title, toolbar, children }) {
  return (
    <div className="admin-data-table card">
      {(title || toolbar) && (
        <div className="admin-data-table__head">
          {title ? <h2 className="admin-data-table__title">{title}</h2> : <span />}
          {toolbar ? <div className="admin-data-table__toolbar">{toolbar}</div> : null}
        </div>
      )}
      <div className="admin-data-table__wrap">{children}</div>
      <style>{`
        .admin-data-table { padding: 0; overflow: hidden; }
        .admin-data-table__head {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-wrap: wrap; padding: 12px 14px; border-bottom: 1px solid var(--border);
          background: var(--white);
        }
        .admin-data-table__title { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--navy); }
        .admin-data-table__toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .admin-data-table__wrap { overflow-x: auto; }
        .admin-data-table table.data { margin: 0; font-size: 13px; }
        .admin-data-table table.data th {
          background: var(--gray-light); color: var(--navy); font-weight: 700;
          padding: 10px 12px; border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .admin-data-table table.data td {
          padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle;
        }
        .admin-data-table table.data tbody tr:nth-child(even) { background: rgba(238, 242, 248, 0.45); }
        .admin-data-table table.data tbody tr:hover { background: var(--teal-light); }
      `}</style>
    </div>
  );
}
