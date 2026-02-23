import { useState } from 'react';
import HealthHero from '../components/HealthHero';
import ExecutiveSummary from '../components/ExecutiveSummary';
import Scorecard from '../components/Scorecard';
import WebsiteOverview from '../components/WebsiteOverview';
import PresenceGrid from '../components/PresenceGrid';
import Findings from '../components/Findings';
import Actions from '../components/Actions';
import ContentStrategy from '../components/ContentStrategy';
import Strengths from '../components/Strengths';
import ClaudePrompt from '../components/ClaudePrompt';

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
      {/* Navigation bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={onBack}>&larr; All Audits</button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <JsonImport onImport={(data) => onUpdate({ ...audit, ...data })} />
          {audit.deployed_url && (
            <a href={audit.deployed_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              View Live
            </a>
          )}
        </div>
      </div>

      {/* Centered report header */}
      <header className="report-header">
        <div className="report-meta">
          Brand &amp; Online Presence Audit &middot; {audit.meta?.generated || 'Draft'}
        </div>
        <h1>{audit.meta?.business_name}</h1>
        {audit.meta?.url && (
          <span className="report-url">
            <a href={audit.meta.url} target="_blank" rel="noopener noreferrer">{audit.meta.url}</a>
          </span>
        )}
      </header>

      {/* Health Score Hero */}
      <HealthHero findings={audit.findings} executiveSummary={audit.executive_summary} />

      {/* Executive Summary */}
      <ExecutiveSummary summary={audit.executive_summary} />

      {/* Scorecard */}
      <Scorecard findings={audit.findings} />

      {/* Website Overview */}
      <WebsiteOverview website={audit.website} />

      {/* Presence */}
      <PresenceGrid presence={audit.presence} />

      <hr className="divider" />

      {/* Detailed Findings */}
      <Findings findings={audit.findings} />

      <hr className="divider" />

      {/* Actions */}
      <Actions actions={audit.actions} />

      <hr className="divider" />

      {/* Content Strategy */}
      <ContentStrategy items={audit.content_strategy} />

      {/* Strengths */}
      <Strengths items={audit.strengths} />

      <hr className="divider" />

      {/* Claude Prompt */}
      <ClaudePrompt prompt={audit.claude_prompt} />

      {/* Footer */}
      <footer style={{
        paddingTop: '2rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.8125rem',
        color: 'var(--text-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{audit.meta?.business_name} - Brand &amp; Online Presence Audit. {audit.meta?.generated && `Prepared ${audit.meta.generated}.`}</span>
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
