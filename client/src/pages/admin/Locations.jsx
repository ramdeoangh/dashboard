import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

export default function Locations() {
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleBusyId, setToggleBusyId] = useState(null);
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
    if (!form.state_id) {
      alert('Select a state first.');
      return;
    }
    await api.post('/admin/locations', { ...form, state_id: Number(form.state_id) });
    setForm({ state_id: form.state_id, name: '', code: '', is_active: true, sort_order: 0 });
    await refresh();
  }

  async function toggleActive(l) {
    setToggleBusyId(l.id);
    try {
      await api.put(`/admin/locations/${l.id}`, {
        state_id: l.state_id,
        name: l.name,
        code: l.code,
        is_active: !Boolean(l.is_active),
        sort_order: l.sort_order,
      });
      await refresh();
    } finally {
      setToggleBusyId(null);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this PAX / city row?')) return;
    await api.delete(`/admin/locations/${id}`);
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Add PAX</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        PAX is the same as city / location. Select the state first, then add the PAX name and optional code.
      </p>
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <h2 style={{ fontSize: '0.95rem', marginBottom: 12 }}>New PAX</h2>
        <form onSubmit={create} className="form-grid" style={{ maxWidth: 640 }}>
          <label>
            State (required first)
            <select value={form.state_id} onChange={(e) => setForm({ ...form, state_id: e.target.value })} required>
              <option value="">Select state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              PAX / city name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Code (optional)
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MH-MUM-PAX" />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!form.state_id}>
            Add PAX
          </button>
        </form>
      </div>

      <AdminDataTable title="PAX / locations">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>State</th>
                <th>PAX / city</th>
                <th>Code</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{l.state_name} ({l.state_code})</td>
                  <td><strong>{l.name}</strong></td>
                  <td>{l.code || '—'}</td>
                  <td>
                    <ToggleSwitch
                      checked={Boolean(l.is_active)}
                      onChange={() => toggleActive(l)}
                      disabled={toggleBusyId === l.id}
                      ariaLabel={`${l.name}: ${l.is_active ? 'active' : 'inactive'}. Toggle active status.`}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-danger" onClick={() => remove(l.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminDataTable>
    </div>
  );
}
