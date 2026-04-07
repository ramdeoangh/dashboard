import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ProjectTiles from '../../components/ProjectTiles.jsx';

export default function Reports() {
  const [states, setStates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stateId, setStateId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [textQ, setTextQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProj, setLoadingProj] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/portal/states');
        setStates(data.data || []);
      } catch (e) {
        setErr(e.response?.data?.error || 'Failed to load states');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!stateId) {
      setLocations([]);
      setLocationId('');
      return;
    }
    (async () => {
      try {
        const { data } = await api.get('/portal/locations', { params: { stateId } });
        setLocations(data.data || []);
        setLocationId('');
      } catch {
        setLocations([]);
      }
    })();
  }, [stateId]);

  async function loadProjects() {
    setLoadingProj(true);
    setErr('');
    try {
      const params = {};
      if (stateId) params.stateId = stateId;
      if (locationId) params.locationId = locationId;
      const q = textQ.trim();
      if (q) params.q = q;
      const { data } = await api.get('/portal/projects', { params });
      setProjects(data.data || []);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoadingProj(false);
    }
  }

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="filterbar card" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
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
        <label className="filter-field" style={{ flex: '1 1 220px', minWidth: 200 }}>
          <span className="filter-label">Text filter</span>
          <input
            type="search"
            value={textQ}
            onChange={(e) => setTextQ(e.target.value)}
            placeholder="Name, description, procurement, beneficiary…"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--off-white)',
            }}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={loadProjects} disabled={loadingProj}>
          {loadingProj ? 'Loading…' : 'Apply filters'}
        </button>
      </div>

      {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}

      {!loadingProj && !projects.length && (
        <EmptyState
          title="No projects"
          hint="Try different filters. Only projects that have been submitted appear here; complete both steps when adding a project."
        />
      )}

      {projects.length > 0 && <ProjectTiles projects={projects} />}

      <style>{`
        .filter-label { font-size: 11px; font-weight: 600; color: var(--gray-text); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .filter-field select { min-width: 180px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--off-white); }
      `}</style>
    </div>
  );
}
