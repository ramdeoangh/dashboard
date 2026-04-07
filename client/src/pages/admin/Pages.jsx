import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import Spinner from '../../components/Spinner.jsx';

export default function Pages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    is_published: true,
    sort_order: 0,
  });

  async function refresh() {
    const { data } = await api.get('/admin/pages');
    setRows(data.data || []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.post('/admin/pages', form);
    setForm({ title: '', slug: '', content: '', is_published: true, sort_order: 0 });
    await refresh();
  }

  async function remove(id) {
    if (!confirm('Delete this page?')) return;
    await api.delete(`/admin/pages/${id}`);
    await refresh();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Dynamic pages</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem' }}>New page</h2>
        <form onSubmit={create} className="form-grid" style={{ maxWidth: 640 }}>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Slug
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </label>
          <label>
            Content (HTML)
            <textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </label>
          <label>
            Published
            <select
              value={form.is_published ? '1' : '0'}
              onChange={(e) => setForm({ ...form, is_published: e.target.value === '1' })}
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </label>
          <label>
            Sort
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </form>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.slug}</td>
                <td>{p.is_published ? 'Yes' : 'No'}</td>
                <td>
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
