import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/admin/stats');
        setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: 'Users', value: data?.users ?? 0 },
    { label: 'Projects', value: data?.projects ?? 0 },
    { label: 'States', value: data?.states ?? 0 },
    { label: 'Locations', value: data?.locations ?? 0 },
  ];

  return (
    <div>
      <h1 className="page-title">Admin dashboard</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Overview of master data volume.
      </p>
      <div className="grid-cards">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>{c.value}</div>
            <div className="muted">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
