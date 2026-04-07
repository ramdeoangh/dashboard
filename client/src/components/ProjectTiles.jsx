import { useState } from 'react';
import ProjectDetailModal from './ProjectDetailModal.jsx';

function excerpt(text, maxLen) {
  if (!text || !String(text).trim()) return '';
  const t = String(text).trim().replace(/\s+/g, ' ');
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

export default function ProjectTiles({ projects, listAriaLabel = 'Project list' }) {
  const [detailProject, setDetailProject] = useState(null);

  if (!projects?.length) return null;

  return (
    <>
      <div className="reports-tiles-wrap">
        <ul className="reports-tiles" aria-label={listAriaLabel}>
          {projects.map((p) => {
            const blurb =
              excerpt(p.description, 160) ||
              excerpt(p.address, 100) ||
              'No description yet. Open more details for full information.';
            return (
              <li key={p.id} className="project-tile">
                <div className="project-tile__field">
                  <span className="project-tile__label">Name</span>
                  <span className="project-tile__value project-tile__value--title">{p.projectName}</span>
                </div>
                <div className="project-tile__field">
                  <span className="project-tile__label">Procurement type</span>
                  <span className="project-tile__value">{p.procurementType || '—'}</span>
                </div>
                <div className="project-tile__tags">
                  {p.categoryName ? (
                    <span className="project-tile__pill">{p.categoryName}</span>
                  ) : (
                    <span className="project-tile__pill project-tile__pill--outline">Uncategorized</span>
                  )}
                  {!p.isApproved && (
                    <span className="project-tile__pill project-tile__pill--pending">Pending approval</span>
                  )}
                </div>
                <p className="project-tile__desc">{blurb}</p>
                <button type="button" className="project-tile__more" onClick={() => setDetailProject(p)}>
                  More details
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {detailProject && <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />}

      <style>{`
        .reports-tiles-wrap {
          padding: 0;
          margin: 0;
          background: transparent;
          border: none;
        }
        .reports-tiles {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .reports-tiles {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          .reports-tiles {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        .project-tile {
          display: flex;
          flex-direction: column;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px 16px 14px;
          box-shadow: var(--shadow);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .project-tile:hover {
          border-color: var(--teal-mid);
          box-shadow: 0 6px 20px rgba(27, 58, 107, 0.1);
        }
        .project-tile__field {
          margin-bottom: 10px;
        }
        .project-tile__field:last-of-type {
          margin-bottom: 0;
        }
        .project-tile__label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--gray-text);
          margin-bottom: 4px;
        }
        .project-tile__value {
          display: block;
          font-size: 14px;
          color: var(--text-dark);
          line-height: 1.35;
        }
        .project-tile__value--title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--navy);
        }
        .project-tile__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 12px 0 10px;
        }
        .project-tile__pill {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--teal-light);
          color: var(--navy-mid);
        }
        .project-tile__pill--outline {
          background: var(--white);
          border: 1px dashed var(--gray-mid);
          color: var(--gray-text);
        }
        .project-tile__pill--pending {
          background: #fff4e5;
          color: #b35c00;
        }
        .project-tile__desc {
          margin: 0 0 14px;
          font-size: 13px;
          color: var(--gray-text);
          line-height: 1.5;
          flex: 1;
        }
        .project-tile__more {
          margin-top: auto;
          align-self: flex-start;
          padding: 0;
          border: none;
          background: none;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--navy-mid);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .project-tile__more:hover { color: var(--navy); }
        .project-tile__more:focus-visible {
          outline: 2px solid var(--teal);
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}
