import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

export default function Locations() {
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    state_id: '',
    name: '',
    code: '',
    is_active: true,
    sort_order: 0,
  });

  async function refresh() {
    const [l, s] = await Promise.all([api.get('/admin/locations'), api.get('/admin/states')]);
    setRows(l.data.data || []);
    setStates(s.data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.post('/admin/locations', { ...form, state_id: Number(form.state_id) });
    setForm({ state_id: form.state_id, name: '', code: '', is_active: true, sort_order: 0 });
    await refresh();
  }

  async function remove(id) {
    if (!confirm('Delete location?')) return;
    await api.delete(`/admin/locations/${id}`);
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">PAX locations</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={create} className="form-grid" style={{ maxWidth: 640 }}>
          <label>
            State
            <select value={form.state_id} onChange={(e) => setForm({ ...form, state_id: e.target.value })} required>
              <option value="">Select…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Code
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">
            Add location
          </button>
        </form>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>State</th>
              <th>Location</th>
              <th>Code</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.state_name} ({l.state_code})
                </td>
                <td>{l.name}</td>
                <td>{l.code || '—'}</td>
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => remove(l.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
