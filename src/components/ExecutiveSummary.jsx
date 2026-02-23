export default function ExecutiveSummary({ summary, businessContext }) {
  if (!summary) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Executive Summary</h2>
      {summary.core_finding && (
        <div className="callout">
          <p><strong style={{ color: 'var(--accent)' }}>The core finding:</strong> {summary.core_finding}</p>
        </div>
      )}
      {summary.opportunity && (
        <div className="callout">
          <p><strong style={{ color: 'var(--accent)' }}>The opportunity:</strong> {summary.opportunity}</p>
        </div>
      )}
      {(summary.business_context || businessContext) && (
        <p>{summary.business_context || businessContext}</p>
      )}
    </section>
  );
}
