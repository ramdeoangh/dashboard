export default function PhotoPair({ oldUrl, newUrl, alt }) {
  return (
    <div className="photo-pair">
      <figure>
        <figcaption className="muted">Previous</figcaption>
        {oldUrl ? (
          <a href={oldUrl} target="_blank" rel="noreferrer">
            <img src={oldUrl} alt={`${alt} before`} />
          </a>
        ) : (
          <div className="ph-empty">No image</div>
        )}
      </figure>
      <figure>
        <figcaption className="muted">Current</figcaption>
        {newUrl ? (
          <a href={newUrl} target="_blank" rel="noreferrer">
            <img src={newUrl} alt={`${alt} after`} />
          </a>
        ) : (
          <div className="ph-empty">No image</div>
        )}
      </figure>
      <style>{`
        .photo-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          min-width: 200px;
        }
        .photo-pair figure { margin: 0; }
        .photo-pair figcaption { font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .photo-pair img {
          width: 100%; max-height: 120px; object-fit: cover;
          border-radius: 6px; border: 1px solid var(--border);
        }
        .ph-empty {
          height: 100px; display: flex; align-items: center; justify-content: center;
          background: var(--gray-light); border-radius: 6px; font-size: 12px; color: var(--gray-text);
        }
      `}</style>
    </div>
  );
}
