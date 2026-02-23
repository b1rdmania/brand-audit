import ScoreBadge from './ScoreBadge';

export default function Findings({ findings }) {
  if (!findings?.length) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Detailed Findings</h2>
      {findings.map(f => (
        <div key={f.category} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ marginBottom: 0 }}>{f.category}</h3>
            <ScoreBadge score={f.score} />
          </div>
          {f.summary && <p>{f.summary}</p>}
          {f.evidence?.length > 0 && (
            <ul style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {f.evidence.map((e, i) => (
                <li key={i} style={{ marginBottom: '0.375rem' }}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
