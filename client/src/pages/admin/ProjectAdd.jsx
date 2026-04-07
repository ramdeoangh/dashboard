import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';
import PhotoPair from '../../components/PhotoPair.jsx';

const emptyStep1 = {
  project_name: '',
  procurement_name: '',
  address: '',
  beneficiary_details: '',
  description: '',
  city: '',
  pincode: '',
  procurement_type: '',
  contact_number: '',
  duration_completion: '',
  state_id: '',
  location_id: '',
};

export default function ProjectAdd() {
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form1, setForm1] = useState(emptyStep1);
  const [workflowStatus, setWorkflowStatus] = useState('in_progress');
  const [blockReason, setBlockReason] = useState('');
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function refreshGrid() {
    const { data } = await api.get('/admin/projects');
    setRows(data.data || []);
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get('/admin/states');
        setStates(s.data.data || []);
        await refreshGrid();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!form1.state_id) {
      setLocations([]);
      return;
    }
    (async () => {
      const { data } = await api.get('/admin/locations');
      const all = data.data || [];
      setLocations(all.filter((l) => String(l.state_id) === String(form1.state_id)));
    })();
  }, [form1.state_id]);

  function resetWizard() {
    setStep(1);
    setProjectId(null);
    setForm1(emptyStep1);
    setWorkflowStatus('in_progress');
    setBlockReason('');
    setOldFile(null);
    setNewFile(null);
    setIsSubmitted(false);
  }

  async function loadProject(id) {
    setSaving(true);
    try {
      const { data } = await api.get(`/admin/projects/${id}`);
      const p = data.data;
      setProjectId(p.id);
      setForm1({
        project_name: p.projectName || '',
        procurement_name: p.procurementName || '',
        address: p.address || '',
        beneficiary_details: p.beneficiaryDetails || '',
        description: p.description || '',
        city: p.city || '',
        pincode: p.pincode || '',
        procurement_type: p.procurementType || '',
        contact_number: p.contactNumber || '',
        duration_completion: p.durationCompletion || '',
        state_id: String(p.stateId),
        location_id: String(p.locationId),
      });
      setWorkflowStatus(p.workflowStatus || 'in_progress');
      setBlockReason(p.blockReason || '');
      setIsSubmitted(Boolean(p.isSubmitted));
      setStep(1);
    } finally {
      setSaving(false);
    }
  }

  async function saveStep1AndNext(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form1,
        state_id: Number(form1.state_id),
        location_id: Number(form1.location_id),
        beneficiary_details: form1.beneficiary_details || null,
        description: form1.description || null,
      };
      if (projectId) {
        await api.patch(`/admin/projects/${projectId}`, payload);
      } else {
        const { data } = await api.post('/admin/projects', payload);
        setProjectId(data.data.id);
      }
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveStep2AndPhotos() {
    if (!projectId) return;
    setSaving(true);
    try {
      await api.patch(`/admin/projects/${projectId}`, {
        workflow_status: workflowStatus,
        block_reason: workflowStatus === 'blocked' ? blockReason : null,
      });
      if (oldFile || newFile) {
        const fd = new FormData();
        if (oldFile) fd.append('oldPhoto', oldFile);
        if (newFile) fd.append('newPhoto', newFile);
        await api.put(`/admin/projects/${projectId}/photos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function finalSubmit(e) {
    e.preventDefault();
    if (isSubmitted) return;
    await saveStep2AndPhotos();
    setSaving(true);
    try {
      await api.post(`/admin/projects/${projectId}/submit`);
      resetWizard();
      await refreshGrid();
      alert('Project submitted for approval.');
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.details?.fieldErrors || 'Submit failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Remove this project? It will be marked inactive.')) return;
    await api.delete(`/admin/projects/${id}`);
    if (projectId === id) resetWizard();
    await refreshGrid();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Add project</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Step {step} of 2 — complete details, then photos and workflow before final submit.
      </p>

      {step === 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Step 1 — Project details</h2>
          <form onSubmit={saveStep1AndNext} className="form-grid" style={{ maxWidth: 720 }}>
            <label>
              Project name
              <input
                value={form1.project_name}
                onChange={(e) => setForm1({ ...form1, project_name: e.target.value })}
                required
              />
            </label>
            <label>
              PAX location
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select
                  value={form1.state_id}
                  onChange={(e) => setForm1({ ...form1, state_id: e.target.value, location_id: '' })}
                  required
                >
                  <option value="">State…</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form1.location_id}
                  onChange={(e) => setForm1({ ...form1, location_id: e.target.value })}
                  required
                  disabled={!form1.state_id}
                >
                  <option value="">Location…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label>
              Procurement details — name
              <input
                value={form1.procurement_name}
                onChange={(e) => setForm1({ ...form1, procurement_name: e.target.value })}
                required
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Procurement type
                <input
                  value={form1.procurement_type}
                  onChange={(e) => setForm1({ ...form1, procurement_type: e.target.value })}
                />
              </label>
              <label>
                Contact number
                <input
                  value={form1.contact_number}
                  onChange={(e) => setForm1({ ...form1, contact_number: e.target.value })}
                />
              </label>
            </div>
            <label>
              Duration of completion
              <input
                value={form1.duration_completion}
                onChange={(e) => setForm1({ ...form1, duration_completion: e.target.value })}
              />
            </label>
            <label>
              Beneficiary details
              <textarea
                rows={3}
                value={form1.beneficiary_details}
                onChange={(e) => setForm1({ ...form1, beneficiary_details: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={form1.description}
                onChange={(e) => setForm1({ ...form1, description: e.target.value })}
              />
            </label>
            <label>
              Address
              <textarea
                rows={2}
                value={form1.address}
                onChange={(e) => setForm1({ ...form1, address: e.target.value })}
                required
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <label>
                City
                <input value={form1.city} onChange={(e) => setForm1({ ...form1, city: e.target.value })} />
              </label>
              <label>
                PIN
                <input value={form1.pincode} onChange={(e) => setForm1({ ...form1, pincode: e.target.value })} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                Save and next
              </button>
              {projectId && (
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} disabled={saving}>
                  Skip to step 2
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Step 2 — Status and photos</h2>
          {isSubmitted && (
            <p className="muted" style={{ marginBottom: 12 }}>
              This project is already submitted for approval. You can still update photos or workflow, then use Save progress.
            </p>
          )}
          <form onSubmit={finalSubmit} className="form-grid" style={{ maxWidth: 720 }}>
            <label>
              Workflow status
              <select
                value={workflowStatus}
                onChange={(e) => setWorkflowStatus(e.target.value)}
                disabled={!projectId}
              >
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
            {workflowStatus === 'blocked' && (
              <label>
                Block reason
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  required={workflowStatus === 'blocked'}
                />
              </label>
            )}
            <label>
              Before photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setOldFile(e.target.files?.[0] || null)}
                disabled={!projectId}
              />
            </label>
            <label>
              After photo (current)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                disabled={!projectId}
              />
            </label>
            <p className="muted" style={{ fontSize: 12 }}>
              Files are stored under <code>projects/&#123;id&#125;_&#123;state&#125;_&#123;pax&#125;/before|after</code>.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>
                Back
              </button>
              <button type="button" className="btn btn-navy" onClick={() => saveStep2AndPhotos()} disabled={saving || !projectId}>
                Save progress
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !projectId || isSubmitted}>
                Final submit
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 className="page-title" style={{ fontSize: '1.05rem', marginTop: 24 }}>
        Your projects
      </h2>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Project</th>
              <th>State / PAX</th>
              <th>Workflow</th>
              <th>Submitted</th>
              <th>Photos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.projectName}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.procurementName}
                  </div>
                </td>
                <td>
                  {p.stateName} / {p.locationName}
                </td>
                <td>{p.workflowStatus}</td>
                <td>{p.isSubmitted ? 'Yes' : 'No'}</td>
                <td>
                  <PhotoPair oldUrl={p.oldPhotoUrl} newUrl={p.newPhotoUrl} alt={p.projectName} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => loadProject(p.id)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => remove(p.id)}>
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
