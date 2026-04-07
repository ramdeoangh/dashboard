import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import PhotoPair from '../../components/PhotoPair.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProjectApprove() {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [rowDraft, setRowDraft] = useState({});

  const canApprove = hasPermission('projects.approve');

  async function fetchList() {
    const params = {};
    if (filterState) params.stateId = filterState;
    if (filterLoc) params.locationId = filterLoc;
    if (q.trim()) params.q = q.trim();
    const { data } = await api.get('/admin/projects/pending-approval', { params });
    const list = data.data || [];
    setRows(list);
    const draft = {};
    list.forEach((p) => {
      draft[p.id] = {
        comment: p.approvalComment || '',
        approved: p.isApproved,
      };
    });
    setRowDraft(draft);
  }

  useEffect(() => {
    if (!canApprove) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const s = await api.get('/admin/states');
        setStates(s.data.data || []);
        await fetchList();
      } finally {
        setLoading(false);
      }
    })();
  }, [canApprove]);

  useEffect(() => {
    if (!filterState) {
      setLocations([]);
      setFilterLoc('');
      return;
    }
    (async () => {
      const { data } = await api.get('/admin/locations');
      const all = data.data || [];
      setLocations(all.filter((l) => String(l.state_id) === String(filterState)));
    })();
  }, [filterState]);

  async function applyFilters(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      await fetchList();
    } finally {
      setLoading(false);
    }
  }

  async function patchApproval(id, isApproved, comment) {
    await api.patch(`/admin/projects/${id}/approval`, {
      is_approved: isApproved,
      approval_comment: comment || null,
    });
    await fetchList();
  }

  async function onToggleApproved(id, nextVal) {
    const prev = rowDraft[id] || { comment: '', approved: false };
    const next = { ...prev, approved: nextVal };
    setRowDraft({ ...rowDraft, [id]: next });
    await patchApproval(id, nextVal, next.comment);
  }

  async function saveComment(id) {
    const draft = rowDraft[id] || { comment: '', approved: false };
    await patchApproval(id, draft.approved, draft.comment);
  }

  if (!canApprove) {
    return (
      <div>
        <h1 className="page-title">Approve project</h1>
        <p className="muted">You do not have permission to approve projects.</p>
      </div>
    );
  }

  if (loading && !rows.length) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Approve project</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Submitted projects — filter by PAX, state, or text. Open a row to review details.
      </p>

      <form className="card form-grid" style={{ marginBottom: 20, maxWidth: 900 }} onSubmit={applyFilters}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
          <label>
            State
            <select value={filterState} onChange={(e) => { setFilterState(e.target.value); setFilterLoc(''); }}>
              <option value="">All</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            PAX location
            <select value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)} disabled={!filterState}>
              <option value="">All</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: 'span 2' }}>
            Text filter
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, description…" />
          </label>
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
        </div>
      </form>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Project</th>
              <th>State / PAX</th>
              <th>Workflow</th>
              <th>Approved</th>
              <th>Comment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <button type="button" className="btn btn-ghost" style={{ padding: 0, fontWeight: 700 }} onClick={() => setModal(p)}>
                    {p.projectName}
                  </button>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.procurementName}
                  </div>
                </td>
                <td>
                  {p.stateName} / {p.locationName}
                </td>
                <td>{p.workflowStatus}</td>
                <td>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(rowDraft[p.id]?.approved)}
                      onChange={(e) => onToggleApproved(p.id, e.target.checked)}
                    />
                    <span className="muted">Approved</span>
                  </label>
                </td>
                <td style={{ minWidth: 200 }}>
                  <textarea
                    rows={2}
                    style={{ width: '100%' }}
                    value={rowDraft[p.id]?.comment ?? ''}
                    onChange={(e) =>
                      setRowDraft({
                        ...rowDraft,
                        [p.id]: { ...rowDraft[p.id], comment: e.target.value, approved: rowDraft[p.id]?.approved ?? false },
                      })
                    }
                  />
                  <button type="button" className="btn btn-ghost" style={{ marginTop: 4 }} onClick={() => saveComment(p.id)}>
                    Save comment
                  </button>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(p)}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 42, 68, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.1rem' }}>{modal.projectName}</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
                Close
              </button>
            </div>
            <dl style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              <div>
                <dt className="muted">Procurement</dt>
                <dd style={{ margin: 0 }}>{modal.procurementName}</dd>
              </div>
              <div>
                <dt className="muted">PAX / State</dt>
                <dd style={{ margin: 0 }}>
                  {modal.locationName} — {modal.stateName} ({modal.stateCode})
                </dd>
              </div>
              <div>
                <dt className="muted">Address</dt>
                <dd style={{ margin: 0 }}>{modal.address}</dd>
              </div>
              <div>
                <dt className="muted">City / PIN</dt>
                <dd style={{ margin: 0 }}>
                  {modal.city} {modal.pincode}
                </dd>
              </div>
              <div>
                <dt className="muted">Beneficiary</dt>
                <dd style={{ margin: 0 }}>{modal.beneficiaryDetails || '—'}</dd>
              </div>
              <div>
                <dt className="muted">Description</dt>
                <dd style={{ margin: 0 }}>{modal.description || '—'}</dd>
              </div>
              <div>
                <dt className="muted">Workflow</dt>
                <dd style={{ margin: 0 }}>
                  {modal.workflowStatus}
                  {modal.workflowStatus === 'blocked' && modal.blockReason ? ` — ${modal.blockReason}` : ''}
                </dd>
              </div>
            </dl>
            <div style={{ marginTop: 16 }}>
              <PhotoPair oldUrl={modal.oldPhotoUrl} newUrl={modal.newPhotoUrl} alt={modal.projectName} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
