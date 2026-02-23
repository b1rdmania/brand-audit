import { scoreColor } from '../lib/theme';

export default function Findings({ findings }) {
  if (!findings?.length) return null;

  return (
    <section className="section">
      <h2>Detailed Findings</h2>
      <p className="section-intro">Click each category to expand the evidence.</p>
      <div className="findings-list">
        {findings.map((f, i) => {
          const s = parseInt(f.score, 10);
          const c = scoreColor(s);
          return (
            <details key={f.category} className="finding-item" open={i === 0}>
              <summary>
                <span className="finding-cat">{f.category}</span>
                <span className="finding-score-pill" style={{ background: c.bg, color: c.text }}>
                  {f.score != null ? `${f.score}/5` : '-'}
                </span>
              </summary>
              <div className="finding-body">
                {f.summary && <p>{f.summary}</p>}
                {f.evidence?.length > 0 && (
                  <div className="finding-evidence">
                    {f.evidence.map((e, j) => (
                      <div key={j} className="evidence-item" dangerouslySetInnerHTML={{ __html: e }} />
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
