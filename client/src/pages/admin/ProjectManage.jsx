import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import AdminDataTable from '../../components/admin/AdminDataTable.jsx';
import PhotoAlbumModal from '../../components/admin/PhotoAlbumModal.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

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

function isRowActive(row) {
  const v = row?.is_active;
  return v === 1 || v === true || v === '1';
}

function IconPhotosStep() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export default function ProjectManage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState(null);
  const [approveBusyId, setApproveBusyId] = useState(null);

  async function fetchList() {
    const params = {};
    if (filterState) params.stateId = filterState;
    if (filterLoc) params.locationId = filterLoc;
    if (q.trim()) params.q = q.trim();
    const { data } = await api.get('/admin/projects', { params });
    setRows(data.data || []);
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get('/admin/states');
        setStates(s.data.data || []);
        await fetchList();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!filterState) {
      setLocations([]);
      setFilterLoc('');
      return;
    }
    (async () => {
      const { data } = await api.get('/admin/locations');
      const all = data.data || [];
      setLocations(
        all.filter(
          (l) => String(l.state_id) === String(filterState) && isRowActive(l),
        ),
      );
    })();
  }, [filterState]);

  const activeStates = useMemo(() => states.filter(isRowActive), [states]);

  useEffect(() => {
    if (!filterState) return;
    if (!activeStates.some((s) => String(s.id) === String(filterState))) {
      setFilterState('');
      setFilterLoc('');
    }
  }, [activeStates, filterState]);

  useEffect(() => {
    if (!filterLoc || !locations.length) return;
    if (!locations.some((l) => String(l.id) === String(filterLoc))) {
      setFilterLoc('');
    }
  }, [locations, filterLoc]);

  async function applyFilters(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      await fetchList();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm('Mark this project as deleted?')) return;
    await api.delete(`/admin/projects/${id}`);
    await fetchList();
  }

  async function toggleApproval(p) {
    if (!canApprove || !p.isSubmitted) return;
    setApproveBusyId(p.id);
    try {
      await api.patch(`/admin/projects/${p.id}/approval`, {
        is_approved: !p.isApproved,
        approval_comment: p.approvalComment ?? null,
      });
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.error || 'Approval update failed');
    } finally {
      setApproveBusyId(null);
    }
  }

  if (loading && !rows.length) return <Spinner />;

  const canApprove = hasPermission('projects.approve');

  return (
    <div>
      <h1 className="page-title">Manage project</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Filter by state, PAX, or search. Pencil = edit details (Add project step 1). Photo frame = photos and workflow (step 2). Trash = delete. Toggle = approve (submitted projects, if you have permission).
      </p>

      <form className="card manage-project-filters" style={{ marginBottom: 16 }} onSubmit={applyFilters}>
        <label className="manage-project-filters__field">
          <span className="manage-project-filters__label">State</span>
          <select value={filterState} onChange={(e) => { setFilterState(e.target.value); setFilterLoc(''); }}>
            <option value="">All</option>
            {activeStates.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="manage-project-filters__field">
          <span className="manage-project-filters__label">PAX</span>
          <select value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)} disabled={!filterState}>
            <option value="">All</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </label>
        <label className="manage-project-filters__field manage-project-filters__field--grow">
          <span className="manage-project-filters__label">Search</span>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, description…" />
        </label>
        <div className="manage-project-filters__submit">
          <button type="submit" className="btn btn-primary">Apply</button>
        </div>
      </form>

      <AdminDataTable title="Projects">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Project</th>
                <th>Category</th>
                <th>State / PAX</th>
                <th>Workflow</th>
                <th>Submitted</th>
                <th>Approved</th>
                <th>Previous</th>
                <th>Current</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.projectName}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{p.procurementType}</div>
                  </td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{p.stateName} / {p.locationName}</td>
                  <td>{p.workflowStatus}</td>
                  <td>{p.isSubmitted ? 'Yes' : 'No'}</td>
                  <td>{p.isApproved ? 'Yes' : 'No'}</td>
                  <td>
                    {p.beforePhotoCount > 0 ? (
                      <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setAlbum({ id: p.id, kind: 'before', title: `Before — ${p.projectName}` })}>
                        View ({p.beforePhotoCount})
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {p.afterPhotoCount > 0 ? (
                      <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setAlbum({ id: p.id, kind: 'after', title: `After — ${p.projectName}` })}>
                        View ({p.afterPhotoCount})
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="project-row-actions">
                      <button
                        type="button"
                        className="project-row-actions__btn"
                        aria-label={`Edit project details — ${p.projectName}`}
                        title="Edit details (step 1)"
                        onClick={() => navigate(`/admin/projects/new?edit=${p.id}`)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="project-row-actions__btn"
                        aria-label={`Edit photos and status — ${p.projectName}`}
                        title="Edit photos and status (step 2)"
                        onClick={() => navigate(`/admin/projects/new?edit=${p.id}&step=2`)}
                      >
                        <IconPhotosStep />
                      </button>
                      <button
                        type="button"
                        className="project-row-actions__btn project-row-actions__btn--danger"
                        aria-label={`Delete project — ${p.projectName}`}
                        title="Delete project"
                        onClick={() => remove(p.id)}
                      >
                        <IconTrash />
                      </button>
                      {canApprove && p.isSubmitted && (
                        <ToggleSwitch
                          checked={Boolean(p.isApproved)}
                          onChange={() => toggleApproval(p)}
                          disabled={approveBusyId === p.id}
                          ariaLabel={`${p.projectName}: ${p.isApproved ? 'approved' : 'not approved'}. Toggle approval.`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminDataTable>

      {album && (
        <PhotoAlbumModal
          projectId={album.id}
          kind={album.kind}
          title={album.title}
          onClose={() => setAlbum(null)}
        />
      )}

      <style>{`
        .manage-project-filters {
          display: grid;
          grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr) minmax(200px, 2fr) auto;
          gap: 14px 16px;
          align-items: end;
          max-width: 100%;
        }
        @media (max-width: 768px) {
          .manage-project-filters {
            grid-template-columns: 1fr;
          }
          .manage-project-filters__submit {
            justify-self: start;
          }
        }
        .manage-project-filters__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 0;
          min-width: 0;
        }
        .manage-project-filters__field--grow {
          min-width: 200px;
        }
        .manage-project-filters__label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gray-text);
        }
        .manage-project-filters select,
        .manage-project-filters input[type="text"] {
          width: 100%;
          min-height: 38px;
          padding: 8px 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--white);
          font-size: 14px;
          color: var(--text-dark);
          box-sizing: border-box;
        }
        .manage-project-filters select:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          background: var(--gray-light);
        }
        .manage-project-filters select:focus,
        .manage-project-filters input[type="text"]:focus {
          outline: 2px solid var(--teal);
          border-color: var(--teal);
        }
        .manage-project-filters__submit {
          display: flex;
          align-items: flex-end;
          padding-bottom: 1px;
        }
        .project-row-actions {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }
        .project-row-actions__btn {
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
        .project-row-actions__btn:hover {
          background: var(--teal-light);
          border-color: var(--teal-mid);
        }
        .project-row-actions__btn--danger {
          color: var(--danger);
        }
        .project-row-actions__btn--danger:hover {
          background: rgba(192, 57, 43, 0.08);
          border-color: var(--danger);
        }
      `}</style>
    </div>
  );
}
