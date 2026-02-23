import { useState } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import StatusBadge from '../components/StatusBadge';
import { averageScore } from '../lib/theme';

function auditStatus(audit) {
  if (audit.deployed_url) return 'deployed';
  if (audit.findings?.length) return 'drafted';
  if (audit.website || audit.presence?.length) return 'discovered';
  return 'intake';
}

const statusLabels = {
  intake: 'Intake',
  discovered: 'Discovered',
  drafted: 'Drafted',
  deployed: 'Deployed',
};

export default function Dashboard({ audits, onSelect, onAdd }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (!newUrl.trim() || !newName.trim()) return;

    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const audit = {
      meta: {
        business_name: newName.trim(),
        slug,
        url: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
        generated: new Date().toISOString().split('T')[0],
      },
    };
    onAdd(audit);
    setNewUrl('');
    setNewName('');
    setShowNewForm(false);
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', marginBottom: '0.5rem' }}>Brand Audits</h1>
          <p style={{ marginBottom: 0, color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            {audits.length} audit{audits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)}>
          + New Audit
        </button>
      </header>

      {showNewForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Audit</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Business name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ flex: '1', minWidth: '200px' }}
              autoFocus
            />
            <input
              className="input"
              placeholder="Website URL"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              style={{ flex: '1.5', minWidth: '250px' }}
            />
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      )}

      {audits.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No audits yet
          </p>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Create a new audit or run <code style={{ background: 'var(--bg-primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8125rem' }}>/brand-audit discover &lt;url&gt;</code> in Claude Code
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {audits.map(audit => {
            const status = auditStatus(audit);
            const avg = audit.findings?.length ? averageScore(audit.findings) : null;
            return (
              <button
                key={audit.meta?.slug}
                className="card"
                onClick={() => onSelect(audit)}
                style={{ cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ marginBottom: 0, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.0625rem' }}>{audit.meta?.business_name}</h3>
                  <StatusBadge status={status} label={statusLabels[status]} />
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  {audit.meta?.url}
                </p>
                {avg !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Avg score:</span>
                    <ScoreBadge score={Math.round(avg)} />
                  </div>
                )}
                {audit.meta?.generated && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 0, marginTop: '0.5rem' }}>
                    {audit.meta.generated}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
