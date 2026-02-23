import { scoreColor } from '../lib/theme';

export default function ScoreBadge({ score }) {
  const { bg, text } = scoreColor(score);
  return (
    <span
      className="score-badge"
      style={{ background: bg, color: text }}
    >
      {score} / 5
    </span>
  );
}
