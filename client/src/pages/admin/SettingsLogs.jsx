import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

function formatTs(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function JsonBlock({ data }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(data ?? null, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);
  return (
    <pre className="log-json-block">
      <code>{text}</code>
    </pre>
  );
}

function buildFullPayload(row) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    correlationId: row.correlationId,
    level: row.level,
    message: row.message,
    method: row.method,
    path: row.path,
    statusCode: row.statusCode,
    durationMs: row.durationMs,
    userId: row.userId,
    ip: row.ip,
    userAgent: row.userAgent,
    meta: row.meta,
  };
}

export default function SettingsLogs() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [draft, setDraft] = useState({ q: '', from: '', to: '' });
  const [filters, setFilters] = useState({ q: '', from: '', to: '' });
  const [expanded, setExpanded] = useState(() => new Set());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const params = { page, pageSize };
      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.from.trim()) params.from = filters.from.trim();
      if (filters.to.trim()) params.to = filters.to.trim();

      const { data } = await api.get('/admin/application-logs', { params });
      const d = data.data || {};
      setRows(d.items ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load logs');
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function applyFilters(e) {
    e.preventDefault();
    setFilters({ ...draft });
    setPage(1);
  }

  function clearFilters() {
    const empty = { q: '', from: '', to: '' };
    setDraft(empty);
    setFilters(empty);
    setPage(1);
  }

  function toggleRow(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="settings-logs">
      <h1 className="page-title">Application logs</h1>
      <p className="muted">Server errors only (JSON in database). Pagination and filters apply to stored error rows.</p>

      <form className="log-filters card" onSubmit={applyFilters}>
        <div className="log-filters__grid">
          <label className="log-filters__full">
            Full text search
            <input
              value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              placeholder="Message, path, correlation id, or JSON content"
              autoComplete="off"
            />
          </label>
          <label>
            From date
            <input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
          </label>
          <label>
            To date
            <input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
          </label>
        </div>
        <div className="log-filters__actions">
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {err && (
        <p className="log-error" role="alert">
          {err}
        </p>
      )}

      {loading && !rows.length ? (
        <Spinner />
      ) : (
        <>
          <div className="log-summary muted">
            {total === 0 ? 'No matching entries.' : `${total} error${total === 1 ? '' : 's'} · page ${page} of ${totalPages}`}
          </div>

          <ul className="log-list">
            {rows.map((row) => {
              const open = expanded.has(row.id);
              return (
                <li key={row.id} className={`log-card card${open ? ' log-card--open' : ''}`}>
                  <button type="button" className="log-card__head" onClick={() => toggleRow(row.id)} aria-expanded={open}>
                    <span className="log-card__chev" aria-hidden>
                      {open ? '▼' : '▶'}
                    </span>
                    <div className="log-card__meta">
                      <span className="log-card__time">{formatTs(row.createdAt)}</span>
                      <span className="log-card__badge">{row.statusCode ?? '—'}</span>
                      <span className="log-card__path" title={row.path}>
                        {row.method} {row.path || '—'}
                      </span>
                    </div>
                    <span className="log-card__msg">{row.message}</span>
                  </button>
                  {open && (
                    <div className="log-card__body">
                      <p className="muted log-card__cid">
                        Correlation: <code>{row.correlationId || '—'}</code>
                        {row.userId != null && (
                          <>
                            {' · '}
                            User #{row.userId}
                          </>
                        )}
                        {row.ip && (
                          <>
                            {' · '}
                            {row.ip}
                          </>
                        )}
                      </p>
                      <h3 className="log-json-title">Full entry (JSON)</h3>
                      <JsonBlock data={buildFullPayload(row)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="log-pager">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="muted">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .settings-logs { max-width: 960px; }
        .log-filters { padding: 16px; margin-top: 16px; margin-bottom: 12px; }
        .log-filters__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 16px;
          align-items: end;
        }
        .log-filters__full { grid-column: 1 / -1; }
        @media (max-width: 720px) {
          .log-filters__grid { grid-template-columns: 1fr; }
          .log-filters__full { grid-column: auto; }
        }
        .log-filters label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--navy); }
        .log-filters input { padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; }
        .log-filters__actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
        .log-error { color: var(--danger); font-weight: 600; margin-top: 12px; }
        .log-summary { margin: 8px 0 12px; }
        .log-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .log-card { padding: 0; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow); }
        .log-card--open { border-color: var(--teal-mid); }
        .log-card__head {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto;
          gap: 4px 10px;
          width: 100%;
          text-align: left;
          padding: 12px 14px;
          border: none;
          background: var(--white);
          cursor: pointer;
          font: inherit;
          color: inherit;
        }
        .log-card__head:hover { background: var(--gray-light); }
        .log-card__chev { grid-row: 1 / span 2; align-self: center; color: var(--gray-text); font-size: 12px; width: 1.2em; }
        .log-card__meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          font-size: 12px; color: var(--gray-text);
        }
        .log-card__time { font-weight: 600; color: var(--navy); }
        .log-card__badge {
          background: rgba(193, 57, 43, 0.12); color: var(--danger); font-weight: 700;
          padding: 2px 8px; border-radius: 4px; font-size: 11px;
        }
        .log-card__path { font-family: ui-monospace, monospace; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .log-card__msg {
          grid-column: 2;
          font-size: 13px; color: var(--text-dark); line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .log-card__body { padding: 0 14px 14px 38px; border-top: 1px solid var(--border); background: var(--off-white); }
        .log-card__cid { margin: 10px 0; font-size: 12px; }
        .log-card__cid code { background: var(--gray-light); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
        .log-json-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--navy); margin: 12px 0 8px; }
        .log-json-block {
          margin: 0; padding: 14px; border-radius: var(--radius);
          background: #1a2332; color: #e8eef7; font-size: 12px; line-height: 1.5;
          overflow-x: auto; max-height: 420px; overflow-y: auto;
          border: 1px solid #2a3548;
        }
        .log-json-block code { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; white-space: pre; }
        .log-pager {
          display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; padding: 12px;
        }
      `}</style>
    </div>
  );
}
