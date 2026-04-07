import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import KpiStrip from '../../components/KpiStrip.jsx';

export default function PortalDashboard() {
  const [boot, setBoot] = useState(null);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, s] = await Promise.all([api.get('/portal/bootstrap'), api.get('/portal/stats')]);
        if (cancelled) return;
        setBoot(b.data.data);
        setStats(s.data.data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner />;
  if (err) return <p style={{ color: 'var(--danger)' }}>{err}</p>;

  const kpis = [
    { value: stats?.totalProjects ?? 0, label: 'Total projects', valClass: 'teal' },
    ...(stats?.byState?.slice(0, 5).map((r, i) => ({
      value: r.project_count,
      label: r.code,
      sub: r.name,
      accent: i === 1 ? 'gold-top' : i === 2 ? 'orange-top' : '',
      valClass: i === 1 ? 'gold' : '',
    })) || []),
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 0, borderRadius: '8px 8px 0 0', borderBottom: 'none' }}>
        <h1 className="page-title">{boot?.portalName || 'Portal'}</h1>
        {boot?.headerHtml && (
          <div className="portal-html muted" dangerouslySetInnerHTML={{ __html: boot.headerHtml }} />
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          Use <Link to="/reports">Reports</Link> to filter projects by state and PAX location. Photos show previous and
          current site conditions.
        </p>
      </div>
      <KpiStrip items={kpis} />

      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="page-title" style={{ fontSize: '1.05rem' }}>
          Recent updates
        </h2>
        <ul className="recent-list">
          {(stats?.recentUpdates || []).map((r) => (
            <li key={r.id}>
              <strong>{r.project_name}</strong>
              <span className="muted"> · {r.state_name}</span>
              <span className="muted" style={{ float: 'right' }}>
                {new Date(r.updated_at).toLocaleString()}
              </span>
            </li>
          ))}
          {!stats?.recentUpdates?.length && <li className="muted">No projects yet.</li>}
        </ul>
      </div>

      {boot?.footerHtml && (
        <footer className="card" style={{ marginTop: 20 }} dangerouslySetInnerHTML={{ __html: boot.footerHtml }} />
      )}

      <style>{`
        .recent-list { list-style: none; padding: 0; margin: 12px 0 0; }
        .recent-list li { padding: 8px 0; border-bottom: 1px solid var(--gray-light); font-size: 14px; }
        .portal-html p { margin: 0.5rem 0 0; }
      `}</style>
    </div>
  );
}
