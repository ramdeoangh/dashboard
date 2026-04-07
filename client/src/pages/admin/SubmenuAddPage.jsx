import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

const emptySub = {
  menu_id: '',
  name: '',
  slug: '',
  path: '',
  sort_order: 0,
  is_active: true,
};

export default function SubmenuAddPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [subForm, setSubForm] = useState(emptySub);
  const [editSubId, setEditSubId] = useState(null);

  async function refresh() {
    const { data } = await api.get('/admin/menus');
    setMenus(data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const subRows = useMemo(
    () =>
      menus.flatMap((m) =>
        (m.submenus || []).map((s) => ({
          ...s,
          parentMenuName: m.name,
          parentMenuId: m.id,
        }))
      ),
    [menus]
  );

  async function saveSub(e) {
    e.preventDefault();
    if (!subForm.menu_id) {
      alert('Select a parent menu.');
      return;
    }
    const body = {
      name: subForm.name.trim(),
      slug: subForm.slug.trim(),
      path: subForm.path?.trim() || '',
      sort_order: Number(subForm.sort_order) || 0,
      is_active: Boolean(subForm.is_active),
    };
    if (editSubId) {
      await api.put(`/admin/menus/submenus/${editSubId}`, body);
    } else {
      await api.post('/admin/menus/submenus', {
        ...body,
        menu_id: Number(subForm.menu_id),
      });
    }
    setSubForm(emptySub);
    setEditSubId(null);
    await refresh();
  }

  function startEditSub(s) {
    setEditSubId(s.id);
    setSubForm({
      menu_id: String(s.menu_id),
      name: s.name,
      slug: s.slug,
      path: s.path || '',
      sort_order: s.sort_order ?? 0,
      is_active: Boolean(s.is_active),
    });
  }

  async function toggleSubActive(s) {
    setToggleBusyId(s.id);
    try {
      await api.put(`/admin/menus/submenus/${s.id}`, {
        name: s.name,
        slug: s.slug,
        path: s.path || '',
        sort_order: s.sort_order ?? 0,
        is_active: !Boolean(s.is_active),
      });
      await refresh();
    } finally {
      setToggleBusyId(null);
    }
  }

  async function removeSub(id) {
    if (!confirm('Delete this submenu?')) return;
    try {
      await api.delete(`/admin/menus/submenus/${id}`);
      if (editSubId === id) {
        setEditSubId(null);
        setSubForm(emptySub);
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
        <h2 style={{ fontSize: '0.95rem', marginBottom: 12 }}>{editSubId ? `Edit submenu #${editSubId}` : 'Add submenu'}</h2>
        <form onSubmit={saveSub} className="form-grid" style={{ maxWidth: 720 }}>
          <label>
            Parent menu
            <select
              value={subForm.menu_id}
              onChange={(e) => setSubForm({ ...subForm, menu_id: e.target.value })}
              required
              disabled={Boolean(editSubId)}
            >
              <option value="">Select…</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <label>
              Name
              <input
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                required
              />
            </label>
            <label>
              Slug
              <input
                value={subForm.slug}
                onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })}
                required
              />
            </label>
            <label>
              Path
              <input value={subForm.path} onChange={(e) => setSubForm({ ...subForm, path: e.target.value })} />
            </label>
            <label>
              Sort
              <input
                type="number"
                value={subForm.sort_order}
                onChange={(e) => setSubForm({ ...subForm, sort_order: Number(e.target.value) })}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              {editSubId ? 'Update submenu' : 'Add submenu'}
            </button>
            {editSubId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditSubId(null);
                  setSubForm(emptySub);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <AdminDataTable title="Submenus">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Menu</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Path</th>
                <th>Sort</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subRows.map((s) => (
                <tr key={s.id}>
                  <td>{s.parentMenuName}</td>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>{s.slug}</td>
                  <td>{s.path || '—'}</td>
                  <td>{s.sort_order}</td>
                  <td>
                    <ToggleSwitch
                      checked={Boolean(s.is_active)}
                      onChange={() => toggleSubActive(s)}
                      disabled={toggleBusyId === s.id}
                      ariaLabel={`${s.name}: ${s.is_active ? 'active' : 'inactive'}`}
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => startEditSub(s)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => removeSub(s.id)}>
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
