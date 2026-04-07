import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

const emptyMenu = {
  name: '',
  slug: '',
  path: '',
  sort_order: 0,
  is_active: true,
  icon: null,
};

export default function MenuAddPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [menuForm, setMenuForm] = useState(emptyMenu);
  const [editMenuId, setEditMenuId] = useState(null);

  async function refresh() {
    const { data } = await api.get('/admin/menus');
    setMenus(data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function saveMenu(e) {
    e.preventDefault();
    const body = {
      name: menuForm.name.trim(),
      slug: menuForm.slug.trim(),
      path: menuForm.path?.trim() || '',
      icon: menuForm.icon ?? null,
      sort_order: Number(menuForm.sort_order) || 0,
      is_active: Boolean(menuForm.is_active),
    };
    if (editMenuId) {
      await api.put(`/admin/menus/${editMenuId}`, body);
    } else {
      await api.post('/admin/menus', body);
    }
    setMenuForm(emptyMenu);
    setEditMenuId(null);
    await refresh();
  }

  function startEditMenu(m) {
    setEditMenuId(m.id);
    setMenuForm({
      name: m.name,
      slug: m.slug,
      path: m.path || '',
      sort_order: m.sort_order ?? 0,
      is_active: Boolean(m.is_active),
      icon: m.icon ?? null,
    });
  }

  async function toggleMenuActive(m) {
    setToggleBusyId(m.id);
    try {
      await api.put(`/admin/menus/${m.id}`, {
        name: m.name,
        slug: m.slug,
        path: m.path || '',
        icon: m.icon ?? null,
        sort_order: m.sort_order ?? 0,
        is_active: !Boolean(m.is_active),
      });
      await refresh();
    } finally {
      setToggleBusyId(null);
    }
  }

  async function removeMenu(id) {
    if (!confirm('Delete this menu? Submenus under it will be removed.')) return;
    try {
      await api.delete(`/admin/menus/${id}`);
      if (editMenuId === id) {
        setEditMenuId(null);
        setMenuForm(emptyMenu);
      }
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <h2 style={{ fontSize: '0.95rem', marginBottom: 12 }}>{editMenuId ? `Edit menu #${editMenuId}` : 'Add menu'}</h2>
        <form onSubmit={saveMenu} className="form-grid" style={{ maxWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <label>
              Name
              <input
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                required
              />
            </label>
            <label>
              Slug
              <input
                value={menuForm.slug}
                onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                required
              />
            </label>
            <label>
              Path
              <input value={menuForm.path} onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })} />
            </label>
            <label>
              Sort
              <input
                type="number"
                value={menuForm.sort_order}
                onChange={(e) => setMenuForm({ ...menuForm, sort_order: Number(e.target.value) })}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              {editMenuId ? 'Update menu' : 'Add menu'}
            </button>
            {editMenuId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditMenuId(null);
                  setMenuForm(emptyMenu);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <AdminDataTable title="Menus">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Path</th>
                <th>Sort</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>{m.slug}</td>
                  <td>{m.path || '—'}</td>
                  <td>{m.sort_order}</td>
                  <td>
                    <ToggleSwitch
                      checked={Boolean(m.is_active)}
                      onChange={() => toggleMenuActive(m)}
                      disabled={toggleBusyId === m.id}
                      ariaLabel={`${m.name}: ${m.is_active ? 'active' : 'inactive'}`}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => startEditMenu(m)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => removeMenu(m.id)}>
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
