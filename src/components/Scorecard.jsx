import ScoreBadge from './ScoreBadge';

export default function Scorecard({ findings }) {
  if (!findings?.length) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Scorecard</h2>
      <p style={{ marginBottom: '1rem' }}>Each category scored 0-5 based on public signals.</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '0.75rem',
      }}>
        {findings.map(f => (
          <div
            key={f.category}
            style={{
              background: 'var(--bg-white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1.125rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{f.category}</span>
            <ScoreBadge score={f.score} />
          </div>
        ))}
      </div>
    </section>
  );
}
