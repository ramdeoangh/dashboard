import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

function DetailRow({ label, children }) {
  if (children == null || children === '') return null;
  return (
    <div className="pdm-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function normKind(p) {
  return String(p?.kind ?? '')
    .toLowerCase()
    .trim();
}

function mergeLegacyPhotos(project, apiList) {
  const list = Array.isArray(apiList) ? apiList : [];
  const before = list.filter((p) => p?.url && normKind(p) === 'before');
  const after = list.filter((p) => p?.url && normKind(p) === 'after');
  const seenB = new Set(before.map((p) => p.url));
  const seenA = new Set(after.map((p) => p.url));
  if (project.oldPhotoUrl && !seenB.has(project.oldPhotoUrl)) {
    before.push({
      id: 'legacy-before',
      url: project.oldPhotoUrl,
      originalName: null,
      kind: 'before',
    });
  }
  if (project.newPhotoUrl && !seenA.has(project.newPhotoUrl)) {
    after.push({
      id: 'legacy-after',
      url: project.newPhotoUrl,
      originalName: null,
      kind: 'after',
    });
  }
  return { before, after };
}

export default function ProjectDetailModal({ project, onClose }) {
  const closeRef = useRef(null);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosErr, setPhotosErr] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!project?.id) return undefined;
    const pid = Number(project.id);
    if (!Number.isFinite(pid) || pid < 1) return undefined;

    let cancelled = false;
    (async () => {
      setPhotosLoading(true);
      setPhotosErr('');
      try {
        const { data } = await api.get('/portal/project-photo-list', { params: { projectId: pid } });
        const list = Array.isArray(data?.data) ? data.data : [];
        if (cancelled) return;
        const merged = mergeLegacyPhotos(project, list);
        setBeforePhotos(merged.before);
        setAfterPhotos(merged.after);
      } catch (e) {
        if (!cancelled) {
          const status = e.response?.status;
          const msg = e.response?.data?.error;
          if (status === 404 || msg === 'Not found') {
            setPhotosErr('');
          } else if (msg) {
            setPhotosErr(msg);
          } else {
            setPhotosErr('');
          }
          const embedded = Array.isArray(project.photos) ? project.photos : [];
          const merged = mergeLegacyPhotos(project, embedded);
          setBeforePhotos(merged.before);
          setAfterPhotos(merged.after);
        }
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id, project?.oldPhotoUrl, project?.newPhotoUrl, project?.photos]);

  if (!project) return null;

  return (
    <div
      className="pdm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdm-title"
      onClick={onClose}
    >
      <div className="pdm-shell" onClick={(e) => e.stopPropagation()}>
        <header className="pdm-hero">
          <div className="pdm-hero__inner">
            <p className="pdm-eyebrow">Project</p>
            <h2 id="pdm-title" className="pdm-title">
              {project.projectName}
            </h2>
            {project.categoryName && (
              <span className="pdm-badge pdm-badge--cat">{project.categoryName}</span>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="pdm-close btn btn-ghost"
            onClick={onClose}
            aria-label="Close details"
          >
            Close
          </button>
        </header>

        <div className="pdm-body">
          <section className="pdm-section pdm-meta">
            <dl className="pdm-dl">
              <DetailRow label="Procurement">{project.procurementName}</DetailRow>
              <DetailRow label="Type">{project.procurementType}</DetailRow>
              <DetailRow label="State">{project.stateName}</DetailRow>
              <DetailRow label="PAX / location">{project.locationName}</DetailRow>
              <DetailRow label="City">{project.city}</DetailRow>
              <DetailRow label="PIN code">{project.pincode}</DetailRow>
              <DetailRow label="Start date">{project.startDate || '—'}</DetailRow>
              <DetailRow label="End date">{project.endDate || '—'}</DetailRow>
              <DetailRow label="Start year">{project.startYear != null ? project.startYear : '—'}</DetailRow>
              <DetailRow label="Contact">{project.contactNumber}</DetailRow>
            </dl>
          </section>

          {project.address && (
            <section className="pdm-section">
              <h3 className="pdm-h3">Address</h3>
              <p className="pdm-text">{project.address}</p>
            </section>
          )}

          {project.description && (
            <section className="pdm-section">
              <h3 className="pdm-h3">Description</h3>
              <p className="pdm-text pdm-text--pre">{project.description}</p>
            </section>
          )}

          {project.beneficiaryDetails && (
            <section className="pdm-section pdm-section--accent">
              <h3 className="pdm-h3">Beneficiary details</h3>
              <p className="pdm-text pdm-text--pre">{project.beneficiaryDetails}</p>
            </section>
          )}

          <section className="pdm-section">
            <h3 className="pdm-h3">Site photos</h3>
            {photosLoading && <p className="pdm-muted">Loading photos…</p>}
            {photosErr && !photosLoading && (
              <p className="pdm-err" role="status">
                {photosErr}
              </p>
            )}
            {!photosLoading && (
              <>
                <div className="pdm-photo-block">
                  <h4 className="pdm-h4">Previous</h4>
                  {beforePhotos.length > 0 ? (
                    <div className="pdm-photo-grid">
                      {beforePhotos.map((ph, idx) => (
                        <figure
                          key={`before-${idx}-${ph.id ?? ''}-${ph.url}`}
                          className="pdm-photo-item"
                        >
                          <a href={ph.url} target="_blank" rel="noreferrer">
                            <img src={ph.url} alt={ph.originalName || `${project.projectName} before`} />
                          </a>
                          {ph.originalName && <figcaption className="pdm-caption">{ph.originalName}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <p className="pdm-muted">No previous photos.</p>
                  )}
                </div>
                <div className="pdm-photo-block pdm-photo-block--after">
                  <h4 className="pdm-h4">Current</h4>
                  {afterPhotos.length > 0 ? (
                    <div className="pdm-photo-grid">
                      {afterPhotos.map((ph, idx) => (
                        <figure
                          key={`after-${idx}-${ph.id ?? ''}-${ph.url}`}
                          className="pdm-photo-item"
                        >
                          <a href={ph.url} target="_blank" rel="noreferrer">
                            <img src={ph.url} alt={ph.originalName || `${project.projectName} current`} />
                          </a>
                          {ph.originalName && <figcaption className="pdm-caption">{ph.originalName}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <p className="pdm-muted">No current photos.</p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      <style>{`
        .pdm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(18, 40, 80, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
        }
        .pdm-shell {
          width: 100%;
          max-width: 800px;
          max-height: min(92vh, 900px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          background: var(--white);
          border: 1px solid var(--border);
          box-shadow: 0 20px 50px rgba(27, 58, 107, 0.18);
        }
        .pdm-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 20px 18px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 55%, var(--teal-mid) 160%);
          color: var(--white);
        }
        .pdm-hero__inner { min-width: 0; flex: 1; }
        .pdm-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.85;
        }
        .pdm-title {
          margin: 0 0 10px;
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--white);
        }
        .pdm-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
        }
        .pdm-badge--cat { background: rgba(255, 255, 255, 0.95); color: var(--navy); border-color: transparent; }
        .pdm-close {
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.35);
          color: var(--white);
        }
        .pdm-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.28);
        }
        .pdm-body {
          overflow-y: auto;
          padding: 0 20px 20px;
        }
        .pdm-section {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid var(--gray-light);
        }
        .pdm-section:first-of-type {
          margin-top: 16px;
          padding-top: 0;
          border-top: none;
        }
        .pdm-section--accent {
          background: linear-gradient(180deg, var(--teal-light) 0%, transparent 100%);
          margin-left: -20px;
          margin-right: -20px;
          padding: 18px 20px 4px;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .pdm-h3 {
          margin: 0 0 8px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--gray-text);
        }
        .pdm-h4 {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--navy);
        }
        .pdm-text {
          margin: 0;
          font-size: 14px;
          color: var(--text-dark);
          line-height: 1.55;
        }
        .pdm-text--pre { white-space: pre-wrap; word-break: break-word; }
        .pdm-muted {
          margin: 0;
          font-size: 13px;
          color: var(--gray-text);
        }
        .pdm-err {
          margin: 0 0 8px;
          font-size: 13px;
          color: var(--danger);
        }
        .pdm-meta .pdm-dl { margin: 0; }
        .pdm-row {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 8px 16px;
          padding: 10px 0;
          border-bottom: 1px solid var(--gray-light);
          font-size: 13px;
        }
        .pdm-row:last-child { border-bottom: none; }
        .pdm-row dt {
          margin: 0;
          font-weight: 600;
          color: var(--gray-text);
        }
        .pdm-row dd {
          margin: 0;
          color: var(--text-dark);
        }
        @media (max-width: 520px) {
          .pdm-row { grid-template-columns: 1fr; gap: 2px; }
        }
        .pdm-photo-block {
          margin-bottom: 16px;
        }
        .pdm-photo-block--after {
          margin-bottom: 0;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--gray-light);
        }
        .pdm-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .pdm-photo-item {
          margin: 0;
        }
        .pdm-photo-item img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--border);
          display: block;
        }
        .pdm-caption {
          margin: 4px 0 0;
          font-size: 11px;
          color: var(--gray-text);
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
