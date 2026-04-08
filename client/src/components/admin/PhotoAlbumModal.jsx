import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { mediaUrlFromApi } from '../../config.js';

export default function PhotoAlbumModal({ projectId, kind, title, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const { data } = await api.get(`/admin/projects/${projectId}/photos`);
        const list = (data.data || []).filter((p) => p.kind === kind);
        if (!cancelled) setPhotos(list.map((p) => ({ ...p, url: mediaUrlFromApi(p.url) })));
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || 'Failed to load photos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, kind]);

  return (
    <div className="album-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="album-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="album-modal__head">
          <h2 className="album-modal__title">{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}
        {!loading && !photos.length && <p className="muted">No photos.</p>}
        <div className="album-grid">
          {photos.map((p) => (
            <figure key={p.id} className="album-item">
              <a href={p.url} target="_blank" rel="noreferrer">
                <img src={p.url} alt={p.originalName || ''} />
              </a>
              <figcaption className="muted">{p.originalName || p.filePath?.split('/').pop()}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <style>{`
        .album-backdrop {
          position: fixed; inset: 0; z-index: 60; background: rgba(26, 42, 68, 0.5);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .album-modal { max-width: 900px; width: 100%; max-height: 90vh; overflow: auto; padding: 16px; }
        .album-modal__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .album-modal__title { margin: 0; font-size: 1.05rem; }
        .album-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .album-item { margin: 0; }
        .album-item img {
          width: 100%; height: 120px; object-fit: cover; border-radius: 6px;
          border: 1px solid var(--border);
        }
        .album-item figcaption { font-size: 11px; margin-top: 4px; word-break: break-all; }
      `}</style>
    </div>
  );
}
