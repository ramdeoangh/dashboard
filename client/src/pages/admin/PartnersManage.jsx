import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { mediaUrlFromApi } from '../../config.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { toastError, toastSuccess } from '../../toastBus.js';

const emptyForm = { name: '', slug: '' };

function normalizeSlug(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PartnersManage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('partners.edit');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', slug: '' });
  const [saveBusyId, setSaveBusyId] = useState(null);

  async function refresh() {
    const { data } = await api.get('/admin/partners', { params: { all: '1' } });
    setRows(data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post('/admin/partners', {
        name: form.name.trim(),
        slug: normalizeSlug(form.slug),
      });
      toastSuccess('Partner created.');
      setForm(emptyForm);
      await refresh();
    } catch {
      /* error toast from API client */
    }
  }

  async function toggleActive(p) {
    setToggleBusyId(p.id);
    try {
      await api.patch(`/admin/partners/${p.id}`, { is_active: !p.isActive });
      toastSuccess(`Partner ${p.name} is now ${p.isActive ? 'inactive' : 'active'}.`);
      await refresh();
    } catch {
      /* error toast from API client */
    } finally {
      setToggleBusyId(null);
    }
  }

  async function uploadLogo(partnerId, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      await api.post(`/admin/partners/${partnerId}/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toastSuccess('Partner logo updated.');
      await refresh();
    } catch {
      /* error toast from API client */
    }
    e.target.value = '';
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditDraft({ name: p.name, slug: p.slug });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({ name: '', slug: '' });
  }

  async function saveEdit(e, partnerId) {
    e.preventDefault();
    const slug = normalizeSlug(editDraft.slug);
    const name = editDraft.name.trim();
    if (!name || !slug) {
      toastError('Name and slug are required.');
      return;
    }
    setSaveBusyId(partnerId);
    try {
      await api.patch(`/admin/partners/${partnerId}`, { name, slug });
      toastSuccess('Partner updated.');
      cancelEdit();
      await refresh();
    } catch {
      /* error toast from API client */
    } finally {
      setSaveBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Partners</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Organisations for partner-scoped users and projects. Upload a small square logo for the portal header.
      </p>

      {canEdit && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <h2 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Add partner</h2>
          <form onSubmit={create} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end', maxWidth: 640 }}>
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Slug
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                placeholder="e.g. acme-corp"
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </form>
        </div>
      )}

      <AdminDataTable title="Partners">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Active</th>
                {canEdit ? (
                  <>
                    <th>Upload</th>
                    <th style={{ minWidth: 140 }}>Actions</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.logoUrl ? (
                      <img
                        src={mediaUrlFromApi(p.logoUrl)}
                        alt=""
                        style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                      />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {canEdit && editingId === p.id ? (
                      <input
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                        style={{ width: '100%', maxWidth: 220 }}
                        aria-label="Partner name"
                      />
                    ) : (
                      <strong>{p.name}</strong>
                    )}
                  </td>
                  <td className={editingId === p.id ? '' : 'muted'}>
                    {canEdit && editingId === p.id ? (
                      <input
                        value={editDraft.slug}
                        onChange={(e) => setEditDraft((d) => ({ ...d, slug: e.target.value }))}
                        style={{ width: '100%', maxWidth: 180, fontFamily: 'monospace', fontSize: 13 }}
                        aria-label="Partner slug"
                      />
                    ) : (
                      p.slug
                    )}
                  </td>
                  <td>
                    <ToggleSwitch
                      checked={Boolean(p.isActive)}
                      onChange={() => toggleActive(p)}
                      disabled={!canEdit || toggleBusyId === p.id || editingId === p.id}
                      ariaLabel={`${p.name}: ${p.isActive ? 'active' : 'inactive'}`}
                    />
                  </td>
                  {canEdit ? (
                    <>
                      <td>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadLogo(p.id, e)}
                          disabled={editingId === p.id}
                        />
                      </td>
                      <td>
                        {editingId === p.id ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: 12, padding: '4px 10px' }}
                              disabled={saveBusyId === p.id}
                              onClick={(e) => saveEdit(e, p.id)}
                            >
                              {saveBusyId === p.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: '4px 10px' }}
                              disabled={saveBusyId === p.id}
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => startEdit(p)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminDataTable>
    </div>
  );
}
