export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <span className="muted">{label}</span>
      <style>{`
        .spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; }
        .spinner {
          width: 32px; height: 32px; border: 3px solid var(--gray-light);
          border-top-color: var(--teal); border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
