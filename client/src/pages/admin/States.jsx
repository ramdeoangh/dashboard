import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

export default function States() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', is_active: true, sort_order: 0 });

  async function refresh() {
    const { data } = await api.get('/admin/states');
    setRows(data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.post('/admin/states', { ...form, code: String(form.code).toUpperCase() });
    setForm({ name: '', code: '', is_active: true, sort_order: 0 });
    await refresh();
  }

  async function toggleActive(s) {
    setToggleBusyId(s.id);
    try {
      await api.put(`/admin/states/${s.id}`, {
        name: s.name,
        code: s.code,
        is_active: !Boolean(s.is_active),
        sort_order: s.sort_order,
      });
      await refresh();
    } finally {
      setToggleBusyId(null);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this state? Remove PAX rows under it first.')) return;
    try {
      await api.delete(`/admin/states/${id}`);
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Add State</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Mark states inactive if work has not started there yet or the region is out of reach.
      </p>
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <h2 style={{ fontSize: '0.95rem', marginBottom: 12 }}>New state</h2>
        <form onSubmit={create} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end', maxWidth: 560 }}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Code
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required maxLength={20} />
          </label>
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>

      <AdminDataTable title="States">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.code}</td>
                  <td>
                    <ToggleSwitch
                      checked={Boolean(s.is_active)}
                      onChange={() => toggleActive(s)}
                      disabled={toggleBusyId === s.id}
                      ariaLabel={`${s.name}: ${s.is_active ? 'active' : 'inactive'}. Toggle active status.`}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-danger" onClick={() => remove(s.id)}>
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
