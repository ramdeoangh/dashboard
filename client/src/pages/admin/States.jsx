import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

export default function States() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
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
    await api.post('/admin/states', form);
    setForm({ name: '', code: '', is_active: true, sort_order: 0 });
    await refresh();
  }

  async function remove(id) {
    if (!confirm('Delete state? Related locations must be removed first.')) return;
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
      <h1 className="page-title">States</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={create} className="form-grid" style={{ maxWidth: 480, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Code
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </label>
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </div>
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
                <td>{s.name}</td>
                <td>{s.code}</td>
                <td>{s.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => remove(s.id)}>
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
