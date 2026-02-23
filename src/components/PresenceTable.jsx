import StatusBadge from './StatusBadge';

export default function PresenceTable({ presence }) {
  if (!presence?.length) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Online Presence</h2>
      <div className="table-scroll">
        <table style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th>Channel</th>
              <th>URL</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {presence.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.channel}</td>
                <td>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                      {p.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                  )}
                </td>
                <td><StatusBadge status={p.status} label={p.status} /></td>
                <td>{p.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
