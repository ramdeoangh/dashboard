import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { uploadsUrl } from '../../config.js';
import Spinner from '../../components/Spinner.jsx';
import { toastSuccess } from '../../toastBus.js';

export default function SettingsPortal() {
  const [s, setS] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/admin/settings');
    setS(data.data || {});
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/admin/settings', {
        'portal.name': s['portal.name'],
        'portal.nav_title': s['portal.nav_title'],
        'portal.header_html': s['portal.header_html'],
        'portal.footer_html': s['portal.footer_html'],
      });
      toastSuccess('Portal settings saved.');
      await load();
    } catch {
      /* error toast from API client */
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      await api.post('/admin/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toastSuccess('Logo updated.');
      await load();
    } catch {
      /* error toast from API client */
    }
    e.target.value = '';
  }

  if (loading) return <Spinner />;

  const logoUrl = uploadsUrl(s['portal.logo_path']);

  return (
    <div>
      <h1 className="page-title">Portal &amp; branding</h1>
      <form onSubmit={save} className="form-grid" style={{ maxWidth: 640 }}>
        <label>
          Portal name
          <input
            value={s['portal.name'] ?? ''}
            onChange={(e) => setS({ ...s, 'portal.name': e.target.value })}
          />
        </label>
        <label>
          Portal header tagline
          <input
            value={s['portal.nav_title'] ?? ''}
            onChange={(e) => setS({ ...s, 'portal.nav_title': e.target.value })}
            placeholder="e.g. Project Report"
          />
          <span className="muted" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            Shown in the portal top bar beside the partner or portal name.
          </span>
        </label>
        <label>
          Header HTML
          <textarea rows={4} value={s['portal.header_html'] ?? ''} onChange={(e) => setS({ ...s, 'portal.header_html': e.target.value })} />
        </label>
        <label>
          Footer HTML
          <textarea rows={4} value={s['portal.footer_html'] ?? ''} onChange={(e) => setS({ ...s, 'portal.footer_html': e.target.value })} />
        </label>
        <label>
          Logo
          {logoUrl && (
            <div style={{ marginBottom: 8 }}>
              <img src={logoUrl} alt="Logo" style={{ maxHeight: 48, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
          )}
          <input type="file" accept="image/*" onChange={uploadLogo} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
