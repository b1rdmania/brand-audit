const statusStyles = {
  active: { bg: 'var(--green-light)', color: 'var(--green)' },
  deployed: { bg: 'var(--green-light)', color: 'var(--green)' },
  stale: { bg: 'var(--yellow-light)', color: 'var(--yellow)' },
  discovered: { bg: 'var(--yellow-light)', color: 'var(--yellow)' },
  drafted: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  missing: { bg: 'var(--red-light)', color: 'var(--red)' },
  broken: { bg: 'var(--red-light)', color: 'var(--red)' },
  intake: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  pending: { bg: 'var(--accent-light)', color: 'var(--accent)' },
};

export default function StatusBadge({ status, label }) {
  const style = statusStyles[status] || statusStyles.pending;
  return (
    <span
      className="badge"
      style={{ background: style.bg, color: style.color }}
    >
      {label || status}
    </span>
  );
}
