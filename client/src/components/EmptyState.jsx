export default function EmptyState({ title, hint }) {
  return (
    <div className="empty-state card" style={{ textAlign: 'center', padding: '32px 20px' }}>
      <p className="page-title" style={{ marginBottom: 8 }}>
        {title}
      </p>
      {hint && <p className="muted">{hint}</p>}
    </div>
  );
}
