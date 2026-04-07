import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

export default function SettingsEmail() {
  const [s, setS] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/settings');
        setS(data.data || {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.patch('/admin/settings', {
        'email.smtp_host': s['email.smtp_host'],
        'email.smtp_port': s['email.smtp_port'],
        'email.smtp_user': s['email.smtp_user'],
        'email.smtp_secure': s['email.smtp_secure'],
        'email.from_address': s['email.from_address'],
        'email.smtp_pass': s['email.smtp_pass'],
      });
      setMsg('Saved.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Email (SMTP)</h1>
      <p className="muted">Credentials are stored in the database; restrict admin access in production.</p>
      <form onSubmit={save} className="form-grid" style={{ maxWidth: 520, marginTop: 16 }}>
        <label>
          SMTP host
          <input value={s['email.smtp_host'] ?? ''} onChange={(e) => setS({ ...s, 'email.smtp_host': e.target.value })} />
        </label>
        <label>
          SMTP port
          <input value={s['email.smtp_port'] ?? ''} onChange={(e) => setS({ ...s, 'email.smtp_port': e.target.value })} />
        </label>
        <label>
          SMTP user
          <input value={s['email.smtp_user'] ?? ''} onChange={(e) => setS({ ...s, 'email.smtp_user': e.target.value })} />
        </label>
        <label>
          SMTP password
          <input
            type="password"
            value={s['email.smtp_pass'] ?? ''}
            onChange={(e) => setS({ ...s, 'email.smtp_pass': e.target.value })}
            placeholder="Leave blank to keep unchanged"
            autoComplete="new-password"
          />
        </label>
        <label>
          From address
          <input value={s['email.from_address'] ?? ''} onChange={(e) => setS({ ...s, 'email.from_address': e.target.value })} />
        </label>
        <label>
          Secure (TLS)
          <select
            value={String(s['email.smtp_secure'] ?? 'false')}
            onChange={(e) => setS({ ...s, 'email.smtp_secure': e.target.value === 'true' })}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        {msg && <p className="muted">{msg}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
