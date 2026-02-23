function statusGroup(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'claimed') return 'active';
  if (s === 'stale' || s === 'inactive') return 'stale';
  return 'missing';
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'claimed') return 'Active';
  if (s === 'stale' || s === 'inactive') return 'Stale';
  return 'Missing';
}

function PresenceCard({ item }) {
  const group = statusGroup(item.status);
  const name = item.channel || item.platform || '';
  const note = item.notes || statusLabel(item.status);

  return (
    <div className="presence-card">
      <div className={`presence-dot ${group}`} />
      <div className="presence-info">
        <div className="presence-name">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">{name}</a>
          ) : name}
        </div>
        <div className="presence-note">{note}</div>
      </div>
    </div>
  );
}

export default function PresenceGrid({ presence }) {
  if (!presence?.length) return null;

  const active = presence.filter(p => statusGroup(p.status) === 'active');
  const stale = presence.filter(p => statusGroup(p.status) === 'stale');
  const missing = presence.filter(p => statusGroup(p.status) === 'missing');

  return (
    <section className="section">
      <h2>Presence Inventory</h2>
      <p className="section-intro">Where this brand shows up online - and where it doesn't.</p>

      {active.length > 0 && (
        <>
          <div className="presence-section-label">Active ({active.length})</div>
          <div className="presence-grid">
            {active.map((p, i) => <PresenceCard key={i} item={p} />)}
          </div>
        </>
      )}

      {stale.length > 0 && (
        <>
          <div className="presence-section-label">Stale ({stale.length})</div>
          <div className="presence-grid">
            {stale.map((p, i) => <PresenceCard key={i} item={p} />)}
          </div>
        </>
      )}

      {missing.length > 0 && (
        <>
          <div className="presence-section-label">Missing ({missing.length})</div>
          <div className="presence-grid">
            {missing.map((p, i) => <PresenceCard key={i} item={p} />)}
          </div>
        </>
      )}
    </section>
  );
}
