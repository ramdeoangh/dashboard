import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

const emptyIdentity = {
  email: '',
  username: '',
  password: '',
  display_name: '',
  useEmailAsUsername: false,
};

export default function Users() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [identityForm, setIdentityForm] = useState(emptyIdentity);
  const [identityEditId, setIdentityEditId] = useState(null);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [rolePanelUserId, setRolePanelUserId] = useState(null);
  const [rolePanelIds, setRolePanelIds] = useState([]);

  async function refresh() {
    const [u, r] = await Promise.all([api.get('/admin/users'), api.get('/admin/roles')]);
    setRows(u.data.data || []);
    setRoles(r.data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!rolePanelUserId) {
      setRolePanelIds([]);
      return;
    }
    const u = rows.find((x) => x.id === rolePanelUserId);
    if (u) setRolePanelIds([...(u.roleIds || [])]);
  }, [rolePanelUserId, rows]);

  useEffect(() => {
    if (identityForm.useEmailAsUsername && identityForm.email) {
      setIdentityForm((f) => ({ ...f, username: f.email }));
    }
  }, [identityForm.email, identityForm.useEmailAsUsername]);

  function setEmail(v) {
    setIdentityForm((f) => ({
      ...f,
      email: v,
      username: f.useEmailAsUsername ? v : f.username,
    }));
  }

  function toggleRoleInPanel(id) {
    const s = new Set(rolePanelIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setRolePanelIds([...s]);
  }

  async function saveIdentity(e) {
    e.preventDefault();
    const body = {
      email: identityForm.email.trim(),
      username: identityForm.username.trim(),
      display_name: identityForm.display_name.trim(),
      is_active: true,
      role_ids: [],
    };
    if (identityEditId) {
      const u = rows.find((x) => x.id === identityEditId);
      body.is_active = u?.isActive ?? true;
      if (identityForm.password) body.password = identityForm.password;
      await api.put(`/admin/users/${identityEditId}`, body);
    } else {
      await api.post('/admin/users', {
        ...body,
        password: identityForm.password,
        role_ids: [],
      });
    }
    setIdentityForm(emptyIdentity);
    setIdentityEditId(null);
    await refresh();
  }

  async function saveRolePanel() {
    if (!rolePanelUserId) return;
    const u = rows.find((x) => x.id === rolePanelUserId);
    if (!u) return;
    await api.put(`/admin/users/${rolePanelUserId}`, {
      email: u.email,
      username: u.username,
      display_name: u.displayName || '',
      is_active: u.isActive,
      role_ids: rolePanelIds,
    });
    setRolePanelUserId(null);
    await refresh();
  }

  async function toggleActive(u) {
    setToggleBusyId(u.id);
    try {
      await api.put(`/admin/users/${u.id}`, {
        email: u.email,
        username: u.username,
        display_name: u.displayName || '',
        is_active: !u.isActive,
        role_ids: u.roleIds || [],
      });
      await refresh();
    } finally {
      setToggleBusyId(null);
    }
  }

  async function remove(id) {
    if (!confirm('Delete user?')) return;
    await api.delete(`/admin/users/${id}`);
    if (identityEditId === id) {
      setIdentityEditId(null);
      setIdentityForm(emptyIdentity);
    }
    if (rolePanelUserId === id) setRolePanelUserId(null);
    await refresh();
  }

  function openProfileEdit(u) {
    setRolePanelUserId(null);
    setIdentityEditId(u.id);
    setIdentityForm({
      email: u.email,
      username: u.username,
      password: '',
      display_name: u.displayName || '',
      useEmailAsUsername: u.email === u.username,
    });
  }

  function openRolePanel(u) {
    setIdentityEditId(null);
    setIdentityForm(emptyIdentity);
    setRolePanelUserId(u.id);
  }

  if (loading) return <Spinner />;

  const rolePanelUser = rolePanelUserId ? rows.find((x) => x.id === rolePanelUserId) : null;

  return (
    <div>
      <h1 className="page-title">Users</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem' }}>{identityEditId ? `Edit user #${identityEditId}` : 'Add user'}</h2>
        <form onSubmit={saveIdentity} className="form-grid" style={{ maxWidth: 520 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={identityForm.useEmailAsUsername}
              onChange={(e) => {
                const on = e.target.checked;
                setIdentityForm((f) => ({
                  ...f,
                  useEmailAsUsername: on,
                  username: on ? f.email : f.username,
                }));
              }}
            />
            <span>Username same as email</span>
          </label>
          <label>
            Email
            <input type="email" value={identityForm.email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Username
            <input
              value={identityForm.username}
              onChange={(e) => setIdentityForm({ ...identityForm, username: e.target.value })}
              required
              disabled={identityForm.useEmailAsUsername}
            />
          </label>
          <label>
            Display name
            <input
              value={identityForm.display_name}
              onChange={(e) => setIdentityForm({ ...identityForm, display_name: e.target.value })}
            />
          </label>
          <label>
            Password {identityEditId && <span className="muted">(leave blank to keep)</span>}
            <input
              type="password"
              value={identityForm.password}
              onChange={(e) => setIdentityForm({ ...identityForm, password: e.target.value })}
              required={!identityEditId}
              autoComplete="new-password"
            />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              {identityEditId ? 'Update user' : 'Create user'}
            </button>
            {identityEditId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setIdentityEditId(null);
                  setIdentityForm(emptyIdentity);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {rolePanelUser && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem' }}>Assign roles — {rolePanelUser.username}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {roles.map((r) => (
              <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <input type="checkbox" checked={rolePanelIds.includes(r.id)} onChange={() => toggleRoleInPanel(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => saveRolePanel()}>
              Save roles
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setRolePanelUserId(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
        Users Role
      </h2>
      <AdminDataTable title="Users and roles">
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
                  <td>
                    <ToggleSwitch
                      checked={Boolean(u.isActive)}
                      onChange={() => toggleActive(u)}
                      disabled={toggleBusyId === u.id}
                      ariaLabel={`${u.username}: ${u.isActive ? 'active' : 'inactive'}`}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => openRolePanel(u)}>
                      Roles
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => openProfileEdit(u)}>
                      Profile
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
      </AdminDataTable>
    </div>
  );
}
