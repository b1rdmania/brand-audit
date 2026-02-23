import { actionGroupColor } from '../lib/theme';

export default function Actions({ actions }) {
  if (!actions) return null;

  const groups = [];
  if (actions.this_week?.length) groups.push({ key: 'this_week', label: 'This week', sublabel: 'hours each', items: actions.this_week });
  if (actions.this_month?.length) groups.push({ key: 'this_month', label: 'This month', sublabel: '1-2 days each', items: actions.this_month });
  if (actions.ninety_days?.length) groups.push({ key: 'ninety_days', label: '90 days', sublabel: '1 week+ each', items: actions.ninety_days });

  for (const [key, val] of Object.entries(actions)) {
    if (['this_week', 'this_month', 'ninety_days'].includes(key)) continue;
    if (Array.isArray(val) && val.length) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      groups.push({ key, label, sublabel: '', items: val });
    }
  }

  if (!groups.length) return null;

  const quickWins = (actions.this_week || []).slice(0, 3);
  let num = quickWins.length ? 4 : 1;

  return (
    <section className="section">
      <h2>What To Fix</h2>

      {quickWins.length > 0 && (
        <>
          <p className="section-intro">Start with these three quick wins.</p>
          <div className="quick-wins">
            {quickWins.map((a, i) => (
              <div key={i} className="quick-win-card">
                <span className="quick-win-number">{i + 1}</span>
                <h3>{a.title || String(a)}</h3>
                {a.detail && <p>{a.detail}</p>}
                {a.effort && <span className="quick-win-effort">Effort: {a.effort}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {groups.map(group => {
        const { color, colorLight } = actionGroupColor(group.key);
        const items = group.key === 'this_week' ? group.items.slice(quickWins.length) : group.items;
        if (!items.length && group.key === 'this_week') return null;

        const label = group.key === 'this_week' && quickWins.length
          ? `Also this week (${group.sublabel})`
          : `${group.label} (${group.sublabel})`;

        return (
          <div key={group.key} className="action-group">
            <div className="action-group-title" style={{ color, borderBottomColor: colorLight }}>{label}</div>
            <div className="action-list">
              {items.map((a, i) => {
                const currentNum = num++;
                return (
                  <div key={i} className="action-item">
                    <span className="action-num" style={{ background: colorLight, color }}>{currentNum}</span>
                    <div>
                      <strong>{a.title || String(a)}</strong>
                      {a.detail && ` ${a.detail}`}
                      {a.effort && <> <span className="action-effort">({a.effort})</span></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
