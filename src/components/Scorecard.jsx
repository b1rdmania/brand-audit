import { scoreColor } from '../lib/theme';

export default function Scorecard({ findings }) {
  if (!findings?.length) return null;

  const scored = findings.filter(f => f.score != null);
  if (!scored.length) return null;

  return (
    <section className="section">
      <h2>Scorecard</h2>
      <p className="section-intro">Each category scored 0-5 based on publicly available information.</p>
      <div className="score-bars">
        {scored.map(f => {
          const s = parseInt(f.score, 10);
          const pct = (s / 5) * 100;
          const c = scoreColor(s);
          return (
            <div key={f.category} className="score-row">
              <span className="score-row-label">{f.category}</span>
              <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: `${pct}%`, background: c.bar }} />
              </div>
              <span className="score-row-value" style={{ color: c.text }}>{s}/5</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
