import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

function normMobile(s) {
  return String(s || '')
    .replace(/\s/g, '')
    .replace(/^\+91/, '');
}
function validMobile(s) {
  return /^[6-9]\d{9}$/.test(normMobile(s));
}
function validPin(s) {
  return /^[1-9]\d{5}$/.test(String(s || '').trim());
}

/** MySQL / JSON may return 0/1 or booleans; treat only explicit active as selectable for new picks. */
function isRowActive(row) {
  const v = row?.is_active;
  return v === 1 || v === true || v === '1';
}

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
  start_date: '',
  end_date: '',
  state_id: '',
  location_id: '',
  category_id: '',
};

export default function ProjectAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const [states, setStates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form1, setForm1] = useState(emptyStep1);
  const [workflowStatus, setWorkflowStatus] = useState('in_progress');
  const [blockReason, setBlockReason] = useState('');
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const loadProject = useCallback(async (id, targetStep = 1) => {
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
        start_date: p.startDate || '',
        end_date: p.endDate || '',
        state_id: String(p.stateId),
        location_id: String(p.locationId),
        category_id: String(p.categoryId || ''),
      });
      setWorkflowStatus(p.workflowStatus || 'in_progress');
      setBlockReason(p.blockReason || '');
      setIsSubmitted(Boolean(p.isSubmitted));
      setStep(targetStep === 2 ? 2 : 1);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const editId = searchParams.get('edit');
      try {
        if (editId) setLoading(true);
        const [s, c] = await Promise.all([api.get('/admin/states'), api.get('/admin/project-categories')]);
        if (cancelled) return;
        setStates(s.data.data || []);
        setCategories(c.data.data || []);
        if (editId) {
          const wantStep2 = searchParams.get('step') === '2';
          await loadProject(Number(editId), wantStep2 ? 2 : 1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, loadProject]);

  useEffect(() => {
    if (!form1.state_id) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await api.get('/admin/locations');
      if (cancelled) return;
      const all = data.data || [];
      const forState = all.filter((l) => String(l.state_id) === String(form1.state_id));
      const active = forState.filter(isRowActive);
      const current = forState.find((l) => String(l.id) === String(form1.location_id));
      let list = active;
      if (current && !isRowActive(current)) {
        list = [...active, current];
      }
      list = [...list].sort(
        (a, b) => Number(a.sort_order) - Number(b.sort_order) || String(a.name).localeCompare(String(b.name)),
      );
      setLocations(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [form1.state_id, form1.location_id]);

  async function saveStep1AndNext(e) {
    e.preventDefault();
    if (!validMobile(form1.contact_number)) {
      alert('Enter a valid 10-digit Indian mobile number (starting with 6–9).');
      return;
    }
    if (!validPin(form1.pincode)) {
      alert('Enter a valid 6-digit PIN code.');
      return;
    }
    if (!form1.category_id) {
      alert('Select a project category.');
      return;
    }
    if (!form1.start_date || !form1.end_date) {
      alert('Select start date and end date.');
      return;
    }
    if (form1.end_date < form1.start_date) {
      alert('End date must be on or after start date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        project_name: form1.project_name.trim(),
        procurement_name: (form1.procurement_name || '').trim() || form1.procurement_type.trim(),
        address: form1.address.trim(),
        beneficiary_details: form1.beneficiary_details.trim(),
        description: form1.description.trim(),
        city: form1.city.trim(),
        pincode: String(form1.pincode).trim(),
        procurement_type: form1.procurement_type.trim(),
        contact_number: normMobile(form1.contact_number),
        start_date: form1.start_date,
        end_date: form1.end_date,
        state_id: Number(form1.state_id),
        location_id: Number(form1.location_id),
        category_id: Number(form1.category_id),
      };
      if (projectId) {
        await api.patch(`/admin/projects/${projectId}`, payload);
      } else {
        const { data } = await api.post('/admin/projects', payload);
        setProjectId(data.data.id);
      }
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.details?.fieldErrors || err.response?.data?.error;
      alert(typeof msg === 'object' ? JSON.stringify(msg) : msg || 'Save failed');
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
      if (beforeFiles.length || afterFiles.length) {
        const fd = new FormData();
        beforeFiles.forEach((f) => fd.append('beforePhotos', f));
        afterFiles.forEach((f) => fd.append('afterPhotos', f));
        await api.post(`/admin/projects/${projectId}/photos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setBeforeFiles([]);
        setAfterFiles([]);
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
      navigate('/admin/projects/manage', { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Submit failed');
    } finally {
      setSaving(false);
    }
  }

  const statesForSelect = useMemo(() => {
    const active = states.filter(isRowActive);
    const sid = form1.state_id;
    if (!sid) return active;
    const cur = states.find((s) => String(s.id) === String(sid));
    if (cur && !isRowActive(cur)) {
      const merged = [...active, cur];
      return merged.sort(
        (a, b) => Number(a.sort_order) - Number(b.sort_order) || String(a.name).localeCompare(String(b.name)),
      );
    }
    return active;
  }, [states, form1.state_id]);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Add project</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Step {step} of 2 — all fields in step 1 are required. Then add photos and submit.
      </p>

      {step === 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Step 1 — Project details</h2>
          <form onSubmit={saveStep1AndNext} className="form-grid" style={{ maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <label>
                State
                <select
                  value={form1.state_id}
                  onChange={(e) => setForm1({ ...form1, state_id: e.target.value, location_id: '' })}
                  required
                >
                  <option value="">Select…</option>
                  {statesForSelect.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{!isRowActive(s) ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                PAX (location)
                <select
                  value={form1.location_id}
                  onChange={(e) => setForm1({ ...form1, location_id: e.target.value })}
                  required
                  disabled={!form1.state_id}
                >
                  <option value="">Select…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}{!isRowActive(l) ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Contact number (mobile)
                <input
                  value={form1.contact_number}
                  onChange={(e) => setForm1({ ...form1, contact_number: e.target.value })}
                  placeholder="10 digits or +91…"
                  required
                />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Project name
                <input
                  value={form1.project_name}
                  onChange={(e) => setForm1({ ...form1, project_name: e.target.value })}
                  required
                />
              </label>
              <label>
                Procurement type
                <input
                  value={form1.procurement_type}
                  onChange={(e) => setForm1({ ...form1, procurement_type: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Project category
              <select
                value={form1.category_id}
                onChange={(e) => setForm1({ ...form1, category_id: e.target.value })}
                required
              >
                <option value="">Select…</option>
                {categories.filter((c) => c.status === 1).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Beneficiary details
              <textarea
                rows={3}
                value={form1.beneficiary_details}
                onChange={(e) => setForm1({ ...form1, beneficiary_details: e.target.value })}
                required
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={form1.description}
                onChange={(e) => setForm1({ ...form1, description: e.target.value })}
                required
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                City
                <input value={form1.city} onChange={(e) => setForm1({ ...form1, city: e.target.value })} required />
              </label>
              <label>
                PIN
                <input value={form1.pincode} onChange={(e) => setForm1({ ...form1, pincode: e.target.value })} required />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Start date
                <input
                  type="date"
                  value={form1.start_date}
                  onChange={(e) => setForm1({ ...form1, start_date: e.target.value })}
                  required
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={form1.end_date}
                  onChange={(e) => setForm1({ ...form1, end_date: e.target.value })}
                  required
                />
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
              This project is already submitted. Open Manage project to change photos or workflow.
            </p>
          )}
          <form onSubmit={finalSubmit} className="form-grid" style={{ maxWidth: 720 }}>
            <label>
              Workflow status
              <select value={workflowStatus} onChange={(e) => setWorkflowStatus(e.target.value)} disabled={!projectId}>
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
              Before photos (multiple)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setBeforeFiles(Array.from(e.target.files || []))}
                disabled={!projectId}
              />
            </label>
            <label>
              After / current photos (multiple)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setAfterFiles(Array.from(e.target.files || []))}
                disabled={!projectId}
              />
            </label>
            <p className="muted" style={{ fontSize: 12 }}>
              New uploads are <strong>added</strong> to the existing before/after sets; nothing is replaced. Files live
              under <code>&#123;project_id&#125;/before</code> and <code>&#123;project_id&#125;/after</code>.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-navy"
                disabled={saving || !projectId}
                onClick={() => saveStep2AndPhotos()}
              >
                {saving ? 'Saving…' : 'Save photos & status'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !projectId || isSubmitted}>
                Final submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
