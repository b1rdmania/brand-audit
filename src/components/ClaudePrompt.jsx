import { useState } from 'react';

export default function ClaudePrompt({ prompt }) {
  if (!prompt?.prompt_text) return null;

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="section">
      <h2>Next Steps</h2>
      <p>This audit used public information only. When you're ready to act on it, copy the prompt below into Claude and it will walk you through everything.</p>
      <div className="prompt-card">
        <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy prompt'}
        </button>
        <h3>Paste this into Claude</h3>
        <pre className="prompt-pre">{prompt.prompt_text}</pre>
      </div>
    </section>
  );
}
