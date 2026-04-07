import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function ProjectCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function refresh() {
    const { data } = await api.get('/admin/project-categories', {
      params: { includeInactive: '1' },
    });
    setRows(data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slugManual) return;
    setSlug(slugify(name));
  }, [name, slugManual]);

  function startEdit(row) {
    setEditingId(row.id);
    setName(row.name);
    setSlug(row.slug);
    setSlugManual(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setSlug('');
    setSlugManual(false);
  }

  async function submitForm(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const s = slug.trim() || slugify(trimmedName);
    if (editingId) {
      await api.patch(`/admin/project-categories/${editingId}`, {
        name: trimmedName,
        slug: s,
      });
      cancelEdit();
    } else {
      await api.post('/admin/project-categories', { name: trimmedName, slug: s });
      setName('');
      setSlug('');
      setSlugManual(false);
    }
    await refresh();
  }

  async function toggleStatus(row) {
    setToggleBusyId(row.id);
    try {
      await api.patch(`/admin/project-categories/${row.id}`, { status: row.status !== 1 });
      await refresh();
    } finally {
      setToggleBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/project-categories/${deleteTarget.id}`);
      if (editingId === deleteTarget.id) cancelEdit();
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Project category</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Add and manage categories used when creating projects.
      </p>

      <div className="card" style={{ marginBottom: 20, padding: 16, maxWidth: 520 }}>
        <h2 style={{ fontSize: '0.95rem', marginBottom: 12 }}>
          {editingId ? 'Edit project category' : 'Add project category'}
        </h2>
        <form onSubmit={submitForm} className="form-grid">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Slug
            <input
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
              required
            />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <AdminDataTable title="Categories">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td className="muted">{r.slug}</td>
                  <td>
                    <ToggleSwitch
                      checked={r.status === 1}
                      onChange={() => toggleStatus(r)}
                      disabled={toggleBusyId === r.id}
                      ariaLabel={`${r.name}: ${r.status === 1 ? 'active' : 'inactive'}. Toggle status.`}
                    />
                  </td>
                  <td>
                    <div className="category-row-actions">
                      <button
                        type="button"
                        className="category-row-actions__btn"
                        aria-label={`Edit ${r.name}`}
                        onClick={() => startEdit(r)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="category-row-actions__btn category-row-actions__btn--danger"
                        aria-label={`Delete ${r.name}`}
                        onClick={() => setDeleteTarget(r)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminDataTable>

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
          onClick={() => !deleteBusy && setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(26, 42, 68, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 400, width: '100%', padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-category-title" style={{ fontSize: '1rem', marginBottom: 12 }}>
              Deactivate category?
            </h2>
            <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
              This will deactivate &quot;{deleteTarget.name}&quot;. You can reactivate it later with the status toggle if needed.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteBusy}
                onClick={confirmDelete}
              >
                {deleteBusy ? 'Working…' : 'Confirm delete'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={deleteBusy}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .category-row-actions {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .category-row-actions__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--white);
          color: var(--navy);
          cursor: pointer;
        }
        .category-row-actions__btn:hover {
          background: var(--teal-light);
          border-color: var(--teal-mid);
        }
        .category-row-actions__btn--danger {
          color: var(--danger);
        }
        .category-row-actions__btn--danger:hover {
          background: rgba(220, 53, 69, 0.08);
          border-color: var(--danger);
        }
      `}</style>
    </div>
  );
}
