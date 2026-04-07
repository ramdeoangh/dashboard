export default function KpiStrip({ items }) {
  if (!items?.length) return null;
  return (
    <div className="kpi-strip">
      {items.map((k, i) => (
        <div key={i} className={`kpi-card ${k.accent || ''}`}>
          <div className={`kpi-val ${k.valClass || ''}`}>{k.value}</div>
          <div className="kpi-lbl">{k.label}</div>
          {k.sub && <div className="kpi-sub muted">{k.sub}</div>}
        </div>
      ))}
      <style>{`
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          padding: 14px 20px;
          background: var(--navy-dark);
          border-radius: 0 0 var(--radius) var(--radius);
        }
        .kpi-card {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
          border-top: 3px solid var(--teal);
        }
        .kpi-card.gold-top { border-top-color: var(--gold); }
        .kpi-card.orange-top { border-top-color: var(--orange); }
        .kpi-val { font-size: 22px; font-weight: 700; color: var(--white); line-height: 1.1; }
        .kpi-val.teal { color: var(--teal); }
        .kpi-val.gold { color: var(--gold); }
        .kpi-lbl { font-size: 10px; color: var(--teal-light); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-sub { font-size: 10px; margin-top: 2px; color: var(--gray-mid); }
      `}</style>
    </div>
  );
}
