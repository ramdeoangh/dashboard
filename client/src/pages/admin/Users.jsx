import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

const empty = {
  email: '',
  username: '',
  password: '',
  display_name: '',
  is_active: true,
  role_ids: [],
};

export default function Users() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  async function refresh() {
    const [u, r] = await Promise.all([api.get('/admin/users'), api.get('/admin/roles')]);
    setRows(u.data.data || []);
    setRoles(r.data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editId) return;
    const u = rows.find((x) => x.id === editId);
    if (u) {
      setForm({
        email: u.email,
        username: u.username,
        password: '',
        display_name: u.displayName || '',
        is_active: u.isActive,
        role_ids: u.roleIds || [],
      });
    }
  }, [editId, rows]);

  function toggleRole(id) {
    const set = new Set(form.role_ids);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setForm({ ...form, role_ids: [...set] });
  }

  async function save(e) {
    e.preventDefault();
    if (editId) {
      const body = {
        email: form.email,
        username: form.username,
        display_name: form.display_name,
        is_active: form.is_active,
        role_ids: form.role_ids,
      };
      if (form.password) body.password = form.password;
      await api.put(`/admin/users/${editId}`, body);
    } else {
      await api.post('/admin/users', {
        ...form,
        password: form.password,
        role_ids: form.role_ids,
      });
    }
    setForm(empty);
    setEditId(null);
    await refresh();
  }

  async function remove(id) {
    if (!confirm('Delete user?')) return;
    await api.delete(`/admin/users/${id}`);
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem' }}>{editId ? `Edit user #${editId}` : 'New user'}</h2>
        <form onSubmit={save} className="form-grid" style={{ maxWidth: 520 }}>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Username
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </label>
          <label>
            Display name
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </label>
          <label>
            Password {editId && <span className="muted">(leave blank to keep)</span>}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editId}
              autoComplete="new-password"
            />
          </label>
          <label>
            Active
            <select
              value={form.is_active ? '1' : '0'}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </label>
          <div>
            <span className="filter-label" style={{ display: 'block', marginBottom: 6 }}>
              Roles
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map((r) => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input type="checkbox" checked={form.role_ids.includes(r.id)} onChange={() => toggleRole(r.id)} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              {editId ? 'Update' : 'Create'}
            </button>
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEditId(null); setForm(empty); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.username}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {u.email}
                  </div>
                </td>
                <td>{(u.roleSlugs || []).join(', ') || '—'}</td>
                <td>{u.isActive ? 'Yes' : 'No'}</td>
                <td>
                  <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => setEditId(u.id)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => remove(u.id)}>
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
