import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import KpiStrip from '../../components/KpiStrip.jsx';
import ProjectTiles from '../../components/ProjectTiles.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function PortalDashboard() {
  const [boot, setBoot] = useState(null);
  const [stats, setStats] = useState(null);
  const [states, setStates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stateId, setStateId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [textQ, setTextQ] = useState('');
  const [bootstrapFailed, setBootstrapFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProj, setLoadingProj] = useState(false);

  async function loadProjects() {
    setLoadingProj(true);
    try {
      const params = {};
      if (stateId) params.stateId = stateId;
      if (locationId) params.locationId = locationId;
      const q = textQ.trim();
      if (q) params.q = q;
      const { data } = await api.get('/portal/projects', { params });
      setProjects(data.data || []);
    } catch {
      /* error toast from API client */
    } finally {
      setLoadingProj(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, s, st] = await Promise.all([
          api.get('/portal/bootstrap'),
          api.get('/portal/stats'),
          api.get('/portal/states'),
        ]);
        if (cancelled) return;
        setBoot(b.data.data);
        setStats(s.data.data);
        setStates(st.data.data || []);
      } catch {
        if (!cancelled) setBootstrapFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial project load only after bootstrap; filters via Apply
  }, [loading]);

  useEffect(() => {
    if (!stateId) {
      setLocations([]);
      setLocationId('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/portal/locations', { params: { stateId } });
        if (!cancelled) {
          setLocations(data.data || []);
          setLocationId('');
        }
      } catch {
        if (!cancelled) setLocations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stateId]);

  if (loading) return <Spinner />;
  if (bootstrapFailed && !boot) {
    return (
      <p className="muted" style={{ marginTop: 8 }}>
        Unable to load the dashboard. Use the message shown above, or refresh and sign in again.
      </p>
    );
  }

  const kpis = [
    { value: stats?.totalProjects ?? 0, label: 'Total project', valClass: 'teal' },
    { value: stats?.totalStates ?? 0, label: 'Total state' },
    { value: stats?.totalLocations ?? 0, label: 'Total location' },
    { value: stats?.totalBeneficiaries ?? 0, label: 'Total beneficiary' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <KpiStrip items={kpis} />
      </div>

      <div
        className="filterbar card portal-filters"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'flex-end',
            padding: '4px 0',
          }}
        >
          <label className="filter-field">
            <span className="filter-label">State</span>
            <select value={stateId} onChange={(e) => setStateId(e.target.value)}>
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span className="filter-label">PAX / Location</span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={!stateId}
            >
              <option value="">{stateId ? 'All locations' : 'Select a state first'}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field filter-field--grow">
            <span className="filter-label">Text filter</span>
            <input
              type="search"
              value={textQ}
              onChange={(e) => setTextQ(e.target.value)}
              placeholder="Project name, description, procurement, beneficiary…"
              style={{
                minWidth: 220,
                width: '100%',
                maxWidth: 420,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--off-white)',
              }}
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={() => loadProjects()} disabled={loadingProj}>
            {loadingProj ? 'Loading…' : 'Apply filters'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="page-title" style={{ fontSize: '1.05rem' }}>
          Projects
        </h2>
        {!loadingProj && !projects.length && (
          <div style={{ marginTop: 16 }}>
            <EmptyState
              title="No projects"
              hint="Try different filters. Only submitted projects are listed."
            />
          </div>
        )}
        {projects.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <ProjectTiles projects={projects} listAriaLabel="Filtered projects" />
          </div>
        )}
      </div>

      {boot?.footerHtml && (
        <footer className="card" style={{ marginTop: 20 }} dangerouslySetInnerHTML={{ __html: boot.footerHtml }} />
      )}

      <style>{`
        .portal-title-h1 { font-size: 1.45rem; }
        .filter-label { font-size: 11px; font-weight: 600; color: var(--gray-text); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .filter-field select { min-width: 180px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--off-white); }
        .filter-field--grow { flex: 1; min-width: 200px; }
        .portal-filters { padding-left: 16px; padding-right: 16px; padding-bottom: 16px; }
      `}</style>
    </div>
  );
}
