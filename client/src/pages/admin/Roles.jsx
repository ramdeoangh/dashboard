import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

const emptyRole = { name: '', slug: '', description: '', is_active: true };

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyRole);
  const [editRoleId, setEditRoleId] = useState(null);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [detailRoleId, setDetailRoleId] = useState('');
  const [permIds, setPermIds] = useState([]);
  const [menuIds, setMenuIds] = useState(new Set());
  const [submenuIds, setSubmenuIds] = useState(new Set());
  const [menuAccessLoading, setMenuAccessLoading] = useState(false);
  const [menuSaveBusy, setMenuSaveBusy] = useState(false);

  async function refresh() {
    const [r, p] = await Promise.all([api.get('/admin/roles'), api.get('/admin/roles/permissions')]);
    setRoles(r.data.data || []);
    setPerms(p.data.data || []);
  }

  async function loadMenus() {
    const { data } = await api.get('/admin/menus');
    setMenus(data.data || []);
  }

  useEffect(() => {
    Promise.all([refresh().finally(() => setLoading(false)), loadMenus()]);
  }, []);

  useEffect(() => {
    if (!detailRoleId) {
      setPermIds([]);
      setMenuIds(new Set());
      setSubmenuIds(new Set());
      return;
    }
    const id = Number(detailRoleId);
    (async () => {
      setMenuAccessLoading(true);
      try {
        const [{ data: roleRes }, { data: accessRes }] = await Promise.all([
          api.get(`/admin/roles/${id}`),
          api.get(`/admin/roles/${id}/menu-access`),
        ]);
        setPermIds(roleRes.data.permissionIds || []);
        const a = accessRes.data || {};
        setMenuIds(new Set(a.menuIds || []));
        setSubmenuIds(new Set(a.submenuIds || []));
      } finally {
        setMenuAccessLoading(false);
      }
    })();
  }, [detailRoleId]);

  function togglePerm(id) {
    const s = new Set(permIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setPermIds([...s]);
  }

  function toggleMenuId(id) {
    const s = new Set(menuIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setMenuIds(new Set(s));
  }

  function toggleSubmenuId(id) {
    const s = new Set(submenuIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSubmenuIds(new Set(s));
  }

  async function savePerms(e) {
    e.preventDefault();
    if (!detailRoleId) return;
    await api.put(`/admin/roles/${detailRoleId}/permissions`, { permission_ids: permIds });
    await refresh();
  }

  async function saveMenuAccess(e) {
    e.preventDefault();
    if (!detailRoleId) return;
    setMenuSaveBusy(true);
    try {
      await api.put(`/admin/roles/${detailRoleId}/menu-access`, {
        menuIds: [...menuIds],
        submenuIds: [...submenuIds],
      });
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setMenuSaveBusy(false);
    }
  }

  async function saveRole(e) {
    e.preventDefault();
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description?.trim() || null,
      is_active: Boolean(form.is_active),
    };
    if (editRoleId) {
      await api.put(`/admin/roles/${editRoleId}`, body);
    } else {
      await api.post('/admin/roles', body);
    }
    setForm(emptyRole);
    setEditRoleId(null);
    await refresh();
  }

  function startEdit(r) {
    setEditRoleId(r.id);
    setForm({
      name: r.name,
      slug: r.slug,
      description: r.description || '',
      is_active: r.isActive !== false,
    });
  }

  async function toggleRoleActive(r) {
    if (r.slug === 'super_admin') return;
    setToggleBusyId(r.id);
    try {
      await api.put(`/admin/roles/${r.id}`, {
        name: r.name,
        slug: r.slug,
        description: r.description || null,
        is_active: !r.isActive,
      });
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setToggleBusyId(null);
    }
  }

  async function remove(id) {
    if (!confirm('Delete role?')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      if (editRoleId === id) {
        setEditRoleId(null);
        setForm(emptyRole);
      }
      if (String(detailRoleId) === String(id)) setDetailRoleId('');
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

  const detailRole = detailRoleId ? roles.find((x) => String(x.id) === String(detailRoleId)) : null;

  return (
    <div>
      <h1 className="page-title">Roles</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem' }}>{editRoleId ? `Edit role #${editRoleId}` : 'Add role'}</h2>
        <form onSubmit={saveRole} className="form-grid" style={{ maxWidth: 520, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span>Active</span>
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              {editRoleId ? 'Update role' : 'Create role'}
            </button>
            {editRoleId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditRoleId(null);
                  setForm(emptyRole);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <AdminDataTable title="Roles">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td>{r.slug}</td>
                  <td className="muted">{r.description || '—'}</td>
                  <td>
                    <ToggleSwitch
                      checked={Boolean(r.isActive)}
                      onChange={() => toggleRoleActive(r)}
                      disabled={r.slug === 'super_admin' || toggleBusyId === r.id}
                      ariaLabel={`${r.name}: ${r.isActive ? 'active' : 'inactive'}`}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => remove(r.id)} disabled={r.slug === 'super_admin'}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminDataTable>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Menu Role</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Pick a role, tick menus and submenus this role can see in the admin sidebar, then save.
        </p>
        <label style={{ display: 'block', marginBottom: 16, maxWidth: 360 }}>
          Role
          <select value={detailRoleId} onChange={(e) => setDetailRoleId(e.target.value)}>
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.slug})
              </option>
            ))}
          </select>
        </label>

        {detailRoleId && (
          <>
            {menuAccessLoading ? (
              <p className="muted">Loading…</p>
            ) : (
              <form onSubmit={saveMenuAccess} style={{ marginBottom: 24 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, maxHeight: 360, overflowY: 'auto' }}>
                  {menus.map((m) => (
                    <div key={m.id} style={{ marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <input type="checkbox" checked={menuIds.has(m.id)} onChange={() => toggleMenuId(m.id)} />
                        {m.name}
                        <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
                          {m.slug}
                        </span>
                      </label>
                      <ul style={{ listStyle: 'none', margin: '6px 0 0 24px', padding: 0 }}>
                        {(m.submenus || []).map((s) => (
                          <li key={s.id} style={{ marginBottom: 4 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={submenuIds.has(s.id)}
                                onChange={() => toggleSubmenuId(s.id)}
                              />
                              {s.name}
                              <span className="muted">{s.slug}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={menuSaveBusy}>
                  {menuSaveBusy ? 'Saving…' : 'Save menu access'}
                </button>
              </form>
            )}

            <h3 style={{ fontSize: '0.95rem', marginTop: 0 }}>Permissions {detailRole && `— ${detailRole.name}`}</h3>
            <form onSubmit={savePerms}>
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
          </>
        )}

        {!detailRoleId && <p className="muted">Select a role to edit menu access and permissions.</p>}
      </div>
    </div>
  );
}
