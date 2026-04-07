import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

function RoleBoxes({ roles, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {roles.map((r) => (
        <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={value.includes(r.id)}
            onChange={(e) => {
              if (e.target.checked) onChange([...value, r.id]);
              else onChange(value.filter((x) => x !== r.id));
            }}
          />
          {r.name}
        </label>
      ))}
    </div>
  );
}

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [menuForm, setMenuForm] = useState({
    name: '',
    slug: '',
    path: '',
    sort_order: 0,
    roleIds: [],
  });
  const [subForm, setSubForm] = useState({
    menu_id: '',
    name: '',
    slug: '',
    path: '',
    sort_order: 0,
    roleIds: [],
  });

  async function refresh() {
    const [m, r] = await Promise.all([api.get('/admin/menus'), api.get('/admin/roles')]);
    setMenus(m.data.data || []);
    setRoles(r.data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function addMenu(e) {
    e.preventDefault();
    await api.post('/admin/menus', menuForm);
    setMenuForm({ name: '', slug: '', path: '', sort_order: 0, roleIds: [] });
    await refresh();
  }

  async function addSub(e) {
    e.preventDefault();
    await api.post('/admin/menus/submenus', {
      ...subForm,
      menu_id: Number(subForm.menu_id),
    });
    setSubForm({ menu_id: subForm.menu_id, name: '', slug: '', path: '', sort_order: 0, roleIds: [] });
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Menus &amp; submenus</h1>
      <p className="muted">Assign roles to control visibility in the admin sidebar.</p>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Add menu</h2>
        <form onSubmit={addMenu} className="form-grid" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <label>
              Name
              <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required />
            </label>
            <label>
              Slug
              <input value={menuForm.slug} onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })} required />
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
          <div>
            <span className="filter-label" style={{ display: 'block', marginBottom: 6 }}>
              Roles
            </span>
            <RoleBoxes roles={roles} value={menuForm.roleIds} onChange={(ids) => setMenuForm({ ...menuForm, roleIds: ids })} />
          </div>
          <button type="submit" className="btn btn-primary">
            Add menu
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Add submenu</h2>
        <form onSubmit={addSub} className="form-grid" style={{ maxWidth: '100%' }}>
          <label>
            Parent menu
            <select
              value={subForm.menu_id}
              onChange={(e) => setSubForm({ ...subForm, menu_id: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <label>
              Name
              <input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} required />
            </label>
            <label>
              Slug
              <input value={subForm.slug} onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })} required />
            </label>
            <label>
              Path
              <input value={subForm.path} onChange={(e) => setSubForm({ ...subForm, path: e.target.value })} required />
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
          <RoleBoxes roles={roles} value={subForm.roleIds} onChange={(ids) => setSubForm({ ...subForm, roleIds: ids })} />
          <button type="submit" className="btn btn-primary">
            Add submenu
          </button>
        </form>
      </div>

      <div style={{ marginTop: 24 }}>
        {menus.map((m) => (
          <div key={m.id} className="card" style={{ marginBottom: 12 }}>
            <strong>{m.name}</strong>{' '}
            <span className="muted">
              {m.slug} · {m.path}
            </span>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Role IDs: {(m.roleIds || []).join(', ') || 'none'}
            </div>
            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
              {(m.submenus || []).map((s) => (
                <li key={s.id} style={{ marginBottom: 6 }}>
                  {s.name} → {s.path}{' '}
                  <span className="muted">(roles: {(s.roleIds || []).join(', ') || 'none'})</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
