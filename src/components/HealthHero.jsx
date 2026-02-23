import { averageScore, gradeLabel, gradeColor } from '../lib/theme';

export default function HealthHero({ findings, executiveSummary }) {
  if (!findings?.length) return null;

  const avg = averageScore(findings);
  const displayScore = avg.toFixed(1);
  const pct = (avg / 5) * 100;
  const label = gradeLabel(avg);
  const color = gradeColor(avg);

  const r = 68;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;
  const gap = circumference - filled;

  const oppText = executiveSummary?.opportunity || '';
  const firstSentence = oppText.split(/(?<=[.!?])\s+/)[0] || '';

  return (
    <div className="health-hero">
      <div className="health-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border-light)" strokeWidth="10" />
          <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${filled.toFixed(1)} ${gap.toFixed(1)}`}
            strokeLinecap="round" />
        </svg>
        <div className="health-ring-label">
          <div className="health-ring-score" style={{ color }}>{displayScore}</div>
          <div className="health-ring-max">out of 5</div>
        </div>
      </div>
      <div className="health-summary">
        <span className="health-grade" style={{ background: `${color}15`, color }}>{label}</span>
        {firstSentence && <p className="finding-text">{firstSentence}</p>}
      </div>
    </div>
  );
}
