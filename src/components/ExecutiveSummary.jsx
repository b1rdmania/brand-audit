export default function ExecutiveSummary({ summary }) {
  if (!summary) return null;

  return (
    <section className="section">
      {summary.core_finding && (
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}>
          {summary.core_finding}
        </p>
      )}
      {summary.business_context && (
        <p className="exec-context">{summary.business_context}</p>
      )}
    </section>
  );
}
