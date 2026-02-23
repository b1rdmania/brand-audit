function ActionList({ title, actions }) {
  if (!actions?.length) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>{title}</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {actions.map((a, i) => (
          <li
            key={i}
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--bg-white)',
              border: '1px solid var(--border)',
              marginBottom: '0.5rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '1.5rem',
              height: '1.5rem',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: '100px',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
              marginTop: '0.1rem',
            }}>
              {i + 1}
            </span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>{a.title}</strong>
              {a.detail && <p style={{ marginBottom: 0, marginTop: '0.25rem' }}>{a.detail}</p>}
              {a.effort && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'block' }}>
                  Effort: {a.effort}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Actions({ actions }) {
  if (!actions) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Prioritised Actions</h2>
      <ActionList title="This Week" actions={actions.this_week} />
      <ActionList title="This Month" actions={actions.this_month} />
      <ActionList title="90 Days" actions={actions.ninety_days} />
    </section>
  );
}
