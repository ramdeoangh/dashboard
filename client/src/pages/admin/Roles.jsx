import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [permIds, setPermIds] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  async function refresh() {
    const [r, p] = await Promise.all([api.get('/admin/roles'), api.get('/admin/roles/permissions')]);
    setRoles(r.data.data || []);
    setPerms(p.data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setPermIds([]);
      return;
    }
    (async () => {
      const { data } = await api.get(`/admin/roles/${selected}`);
      setPermIds(data.data.permissionIds || []);
    })();
  }, [selected]);

  function togglePerm(id) {
    const s = new Set(permIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setPermIds([...s]);
  }

  async function savePerms(e) {
    e.preventDefault();
    if (!selected) return;
    await api.put(`/admin/roles/${selected}/permissions`, { permission_ids: permIds });
    await refresh();
  }

  async function createRole(e) {
    e.preventDefault();
    await api.post('/admin/roles', form);
    setForm({ name: '', slug: '', description: '' });
    await refresh();
  }

  async function remove(id) {
    if (!confirm('Delete role?')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      if (selected === id) setSelected(null);
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  }

  if (loading) return <Spinner />;

  const grouped = perms.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="page-title">Roles &amp; permissions</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem' }}>New role</h2>
        <form onSubmit={createRole} className="form-grid" style={{ maxWidth: 520, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Slug
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Description
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>
            Create role
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginTop: 0 }}>Roles</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {roles.map((r) => (
              <li key={r.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button
                  type="button"
                  className={`btn btn-ghost ${selected === r.id ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'flex-start' }}
                  onClick={() => setSelected(r.id)}
                >
                  {r.name}
                </button>
                <button type="button" className="btn btn-danger" onClick={() => remove(r.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          {!selected && <p className="muted">Select a role to edit permissions.</p>}
          {selected && (
            <form onSubmit={savePerms}>
              <h3 style={{ fontSize: '0.95rem', marginTop: 0 }}>Permissions</h3>
              {Object.entries(grouped).map(([res, list]) => (
                <div key={res} style={{ marginBottom: 16 }}>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>
                    {res}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {list.map((p) => (
                      <label key={p.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={permIds.includes(p.id)} onChange={() => togglePerm(p.id)} />
                        {p.action}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button type="submit" className="btn btn-primary">
                Save permissions
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        .btn-ghost.active { background: var(--teal-light); border-color: var(--teal); }
      `}</style>
    </div>
  );
}
