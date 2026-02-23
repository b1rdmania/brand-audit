import { useState } from 'react';
import ExecutiveSummary from '../components/ExecutiveSummary';
import Scorecard from '../components/Scorecard';
import PresenceTable from '../components/PresenceTable';
import Findings from '../components/Findings';
import Actions from '../components/Actions';
import ContentStrategy from '../components/ContentStrategy';

function WebsiteOverview({ website }) {
  if (!website) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Website Overview</h2>
      <div className="card-grid">
        <div className="card">
          <h3>Platform</h3>
          <p style={{ marginBottom: 0 }}>{website.platform || 'Unknown'}</p>
        </div>
        {website.pagespeed_mobile != null && (
          <div className="card">
            <h3>PageSpeed (Mobile)</h3>
            <p style={{ marginBottom: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              {website.pagespeed_mobile}<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-tertiary)' }}> / 100</span>
            </p>
          </div>
        )}
        {website.ssl != null && (
          <div className="card">
            <h3>SSL</h3>
            <p style={{ marginBottom: 0 }}>{website.ssl ? 'Valid' : 'Missing / Invalid'}</p>
          </div>
        )}
        {website.blog && (
          <div className="card">
            <h3>Blog</h3>
            <p style={{ marginBottom: 0 }}>
              {website.blog.detected ? `${website.blog.post_count || 0} posts` : 'Not detected'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Strengths({ items }) {
  if (!items?.length) return null;
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Existing Strengths</h2>
      <div className="card">
        <ul style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {items.map((s, i) => (
            <li key={i} style={{ marginBottom: '0.5rem' }}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClaudePrompt({ prompt }) {
  if (!prompt?.prompt_text) return null;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Next Steps</h2>
      <p>Copy the prompt below into Claude to start working on the fixes:</p>
      <div style={{ position: 'relative' }}>
        <pre style={{
          background: 'var(--bg-white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '400px',
          overflow: 'auto',
        }}>
          {prompt.prompt_text}
        </pre>
        <button
          className="btn btn-secondary"
          onClick={handleCopy}
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '0.75rem' }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </section>
  );
}

function JsonImport({ onImport }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState('');

  function handleImport() {
    try {
      const data = JSON.parse(text);
      onImport(data);
      setShow(false);
      setText('');
    } catch (e) {
      alert('Invalid JSON');
    }
  }

  if (!show) {
    return (
      <button className="btn btn-ghost" onClick={() => setShow(true)} style={{ fontSize: '0.8125rem' }}>
        Import audit-data.json
      </button>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <textarea
        className="input"
        rows={8}
        placeholder="Paste audit-data.json contents here..."
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ fontFamily: 'monospace', fontSize: '0.8125rem', marginBottom: '0.75rem' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={handleImport}>Import</button>
        <button className="btn btn-secondary" onClick={() => { setShow(false); setText(''); }}>Cancel</button>
      </div>
    </div>
  );
}

export default function AuditView({ audit, onBack, onUpdate, onDelete }) {
  return (
    <div className="container">
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <button className="btn btn-ghost" onClick={onBack}>
            &larr; All Audits
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <JsonImport onImport={(data) => onUpdate({ ...audit, ...data })} />
            {audit.deployed_url && (
              <a href={audit.deployed_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                View Live
              </a>
            )}
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Brand & Online Presence Audit &middot; {audit.meta?.generated || 'Draft'}
          </div>
          <h1>{audit.meta?.business_name}</h1>
          {audit.executive_summary?.core_finding && (
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
              {audit.executive_summary.core_finding.substring(0, 200)}...
            </p>
          )}
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            <a href={audit.meta?.url} target="_blank" rel="noopener noreferrer">{audit.meta?.url}</a>
          </p>
        </div>
      </header>

      <ExecutiveSummary summary={audit.executive_summary} />
      <Scorecard findings={audit.findings} />
      <WebsiteOverview website={audit.website} />
      <PresenceTable presence={audit.presence} />
      <Findings findings={audit.findings} />
      <Actions actions={audit.actions} />
      <ContentStrategy items={audit.content_strategy} />
      <Strengths items={audit.strengths} />
      <ClaudePrompt prompt={audit.claude_prompt} />

      <footer style={{
        paddingTop: '2rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.8125rem',
        color: 'var(--text-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Generated {audit.meta?.generated}</span>
        <button
          className="btn btn-ghost"
          onClick={onDelete}
          style={{ color: 'var(--red)', fontSize: '0.8125rem' }}
        >
          Delete Audit
        </button>
      </footer>
    </div>
  );
}
