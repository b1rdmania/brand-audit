#!/usr/bin/env node

/**
 * generate-report.mjs
 *
 * Takes an audit-data.json file and produces a self-contained HTML report.
 * The output matches the existing brand audit design system exactly.
 *
 * Usage: node scripts/generate-report.mjs <path-to-audit-data.json> [output-path]
 *
 * If output-path is omitted, writes to reports/{slug}/audit-report.html
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ─── Helpers ───────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scoreClass(score) {
  const n = parseInt(score, 10);
  if (isNaN(n)) return 'score-0';
  return `score-${Math.max(0, Math.min(5, n))}`;
}

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'claimed') return 'status-active';
  if (s === 'stale' || s === 'inactive') return 'status-stale';
  return 'status-missing';
}

// ─── CSS ───────────────────────────────────────────────────────────────

const CSS = `
    * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-primary: #faf9f7; --bg-white: #ffffff; --text-primary: #131314; --text-secondary: #6b6b6f; --text-tertiary: #9b9b9f;
      --accent: #d97757; --accent-light: #f5ebe6; --green: #2d8a4e; --green-light: #e6f4eb; --red: #c4442a; --red-light: #fce8e4;
      --yellow: #b8860b; --yellow-light: #fdf4e0; --border: #e8e8e5; --shadow-sm: 0 1px 3px rgba(0,0,0,0.04); --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
      --radius: 10px; --radius-lg: 14px;
    }
    body { background-color: var(--bg-primary); color: var(--text-primary); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; line-height: 1.6; }
    .container { max-width: 920px; margin: 0 auto; padding: clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem); }
    .report-header { padding-bottom: 3rem; margin-bottom: 3rem; border-bottom: 1px solid var(--border); }
    .report-meta { font-size: 0.8125rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
    h1 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.025em; margin-bottom: 1rem; }
    .report-subtitle { font-size: 1.125rem; color: var(--text-secondary); line-height: 1.5; max-width: 680px; }
    .section { margin-bottom: 3.5rem; }
    h2 { font-size: clamp(1.375rem, 3vw, 1.75rem); font-weight: 650; letter-spacing: -0.02em; margin-bottom: 1.25rem; line-height: 1.25; }
    h3 { font-size: 1.0625rem; font-weight: 600; margin-bottom: 0.75rem; line-height: 1.3; }
    p { color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9375rem; }
    strong { color: var(--text-primary); font-weight: 600; }
    a { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.15s; }
    a:hover { border-bottom-color: var(--accent); }
    .card { background: var(--bg-white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1rem; box-shadow: var(--shadow-sm); }
    .card h3 { margin-bottom: 0.5rem; } .card p:last-child { margin-bottom: 0; }
    .card ul { margin-left: 1rem; color: var(--text-secondary); font-size: 0.875rem; } .card li { margin-bottom: 0.375rem; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .scorecard { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .score-item { background: var(--bg-white); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.125rem 1.25rem; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); }
    .score-label { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
    .score-badge { font-size: 0.8125rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 100px; white-space: nowrap; }
    .score-0, .score-1 { background: var(--red-light); color: var(--red); }
    .score-2 { background: var(--yellow-light); color: var(--yellow); }
    .score-3 { background: var(--yellow-light); color: var(--yellow); }
    .score-4 { background: var(--green-light); color: var(--green); }
    .score-5 { background: var(--green-light); color: var(--green); }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1.5rem; }
    .table-scroll .audit-table { margin-bottom: 0; min-width: 600px; }
    .audit-table { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--bg-white); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm); font-size: 0.875rem; }
    .audit-table th { background: var(--bg-primary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
    .audit-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: top; }
    .audit-table tr:last-child td { border-bottom: none; } .audit-table a { word-break: break-all; }
    .status { display: inline-block; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 100px; white-space: nowrap; }
    .status-active { background: var(--green-light); color: var(--green); }
    .status-stale { background: var(--yellow-light); color: var(--yellow); }
    .status-missing { background: var(--red-light); color: var(--red); }
    .status-broken { background: var(--red-light); color: var(--red); }
    .priority-list { list-style: none; margin-bottom: 1.5rem; }
    .priority-list li { padding: 1rem 1.25rem; background: var(--bg-white); border: 1px solid var(--border); margin-bottom: 0.5rem; border-radius: var(--radius); font-size: 0.9375rem; color: var(--text-secondary); box-shadow: var(--shadow-sm); display: flex; align-items: flex-start; gap: 0.75rem; }
    .priority-list li strong { color: var(--text-primary); }
    .priority-number { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.5rem; background: var(--accent); color: white; border-radius: 100px; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; margin-top: 0.1rem; }
    .callout { background: var(--accent-light); border-left: 3px solid var(--accent); border-radius: 0 var(--radius) var(--radius) 0; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
    .callout p { color: var(--text-primary); margin-bottom: 0; font-size: 0.9375rem; } .callout strong { color: var(--accent); }
    .divider { border: none; border-top: 1px solid var(--border); margin: 3rem 0; }
    .report-footer { padding-top: 2rem; border-top: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-tertiary); }
    @media (max-width: 600px) {
      .scorecard { grid-template-columns: 1fr; } .card-grid { grid-template-columns: 1fr; }
      .priority-list li { font-size: 0.875rem; padding: 0.875rem 1rem; } .card ul { margin-left: 0.5rem; } h1 { font-size: 1.75rem; }
    }
    @media print { body { background: white; } .container { max-width: 100%; padding: 1rem; } .card, .score-item, .audit-table { box-shadow: none; } }
`;

// ─── Section Renderers ─────────────────────────────────────────────────

function renderHeader(meta, executiveSummary) {
  const name = esc(meta?.business_name || 'Untitled Audit');
  const date = esc(meta?.generated || 'Draft');
  const subtitle = executiveSummary?.core_finding
    ? `<p class="report-subtitle">${esc(executiveSummary.core_finding.substring(0, 250))}${executiveSummary.core_finding.length > 250 ? '...' : ''}</p>`
    : '';
  const url = meta?.url ? `<p style="font-size: 0.8125rem; color: var(--text-tertiary);"><a href="${esc(meta.url)}" target="_blank">${esc(meta.url)}</a></p>` : '';

  return `
    <header class="report-header">
      <div class="report-meta">Brand & Online Presence Audit &middot; ${date}</div>
      <h1>${name}</h1>
      ${subtitle}
      ${url}
    </header>`;
}

function renderExecutiveSummary(summary) {
  if (!summary) return '';

  let html = `\n    <section class="section">\n      <h2>Executive Summary</h2>`;

  if (summary.core_finding) {
    html += `\n      <div class="callout">\n        <p><strong>The core finding:</strong> ${summary.core_finding}</p>\n      </div>`;
  }
  if (summary.opportunity) {
    html += `\n      <div class="callout">\n        <p><strong>The opportunity:</strong> ${summary.opportunity}</p>\n      </div>`;
  }
  if (summary.business_context) {
    html += `\n      <p>${summary.business_context}</p>`;
  }

  html += `\n    </section>`;
  return html;
}

function renderScorecard(findings) {
  if (!findings?.length) return '';

  const items = findings
    .filter(f => f.score != null)
    .map(f => `        <div class="score-item"><span class="score-label">${esc(f.category)}</span><span class="score-badge ${scoreClass(f.score)}">${f.score} / 5</span></div>`)
    .join('\n');

  return `
    <section class="section">
      <h2>Scorecard</h2>
      <p>Each category scored 0–5 based on what we could find publicly.</p>
      <div class="scorecard">
${items}
      </div>
    </section>`;
}

function renderWebsiteOverview(website) {
  if (!website) return '';

  let cards = '';

  if (website.platform) {
    cards += `\n        <div class="card"><h3>Platform</h3><p>${esc(website.platform)}</p></div>`;
  }
  if (website.pagespeed_mobile != null) {
    cards += `\n        <div class="card"><h3>PageSpeed (Mobile)</h3><p style="font-size: 1.5rem; font-weight: 700;">${website.pagespeed_mobile}<span style="font-size: 0.875rem; font-weight: 400; color: var(--text-tertiary);"> / 100</span></p></div>`;
  }
  if (website.ssl != null) {
    cards += `\n        <div class="card"><h3>SSL</h3><p>${website.ssl ? 'Valid' : 'Missing / Invalid'}</p></div>`;
  }
  if (website.blog) {
    const blogText = website.blog.detected
      ? `${website.blog.post_count || 0} posts${website.blog.last_post_date ? ` (latest: ${esc(website.blog.last_post_date)})` : ''}`
      : 'Not detected';
    cards += `\n        <div class="card"><h3>Blog</h3><p>${blogText}</p></div>`;
  }

  if (!cards) return '';

  return `
    <section class="section">
      <h2>Website Overview</h2>
      <div class="card-grid">${cards}
      </div>
    </section>`;
}

function renderPresenceTable(presence) {
  if (!presence?.length) return '';

  const rows = presence.map(p => {
    const channel = esc(p.channel || p.platform || '');
    const urlCell = p.url
      ? `<a href="${esc(p.url)}" target="_blank">${esc(p.handle || p.url)}</a>`
      : '—';
    const status = p.status || 'missing';
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const notes = esc(p.notes || '');

    return `          <tr><td><strong>${channel}</strong></td><td>${urlCell}</td><td><span class="status ${statusClass(status)}">${esc(statusText)}</span></td><td>${notes}</td></tr>`;
  }).join('\n');

  return `
    <section class="section">
      <h2>Presence Inventory</h2>
      <div class="table-scroll">
      <table class="audit-table">
        <thead><tr><th>Channel</th><th>URL / Handle</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
      </div>
    </section>`;
}

function renderFindings(findings) {
  if (!findings?.length) return '';

  const cards = findings.map(f => {
    let html = `\n      <h3>${esc(f.category)}${f.score != null ? ` (Score: ${f.score}/5)` : ''}</h3>\n      <div class="card">`;

    if (f.summary) {
      html += `\n        <p>${f.summary}</p>`;
    }

    if (f.evidence?.length) {
      html += `\n        <ul>`;
      for (const e of f.evidence) {
        html += `\n          <li>${e}</li>`;
      }
      html += `\n        </ul>`;
    }

    html += `\n      </div>`;
    return html;
  }).join('\n');

  return `
    <section class="section">
      <h2>Detailed Findings</h2>
${cards}
    </section>`;
}

function renderActionList(title, actions, startNum) {
  if (!actions?.length) return { html: '', nextNum: startNum };

  let num = startNum;
  const items = actions.map(a => {
    let content = `<strong>${a.title || a}</strong>`;
    if (a.detail) content += ` ${a.detail}`;
    if (a.effort) content += `<br><span style="font-size: 0.75rem; color: var(--text-tertiary);">Effort: ${esc(a.effort)}</span>`;
    return `        <li><span class="priority-number">${num++}</span><div>${content}</div></li>`;
  }).join('\n');

  return {
    html: `\n      <h3>${esc(title)}</h3>\n      <ol class="priority-list">\n${items}\n      </ol>`,
    nextNum: num,
  };
}

function renderActions(actions) {
  if (!actions) return '';

  let html = `\n    <section class="section">\n      <h2>Prioritised Action List</h2>`;

  let num = 1;

  if (actions.this_week?.length) {
    const r = renderActionList('Fix this week (hours each)', actions.this_week, num);
    html += r.html;
    num = r.nextNum;
  }

  if (actions.this_month?.length) {
    const r = renderActionList('Fix this month (1–2 days each)', actions.this_month, num);
    html += r.html;
    num = r.nextNum;
  }

  if (actions.ninety_days?.length) {
    const r = renderActionList('Fix in 90 days (1 week+ each)', actions.ninety_days, num);
    html += r.html;
    num = r.nextNum;
  }

  // Handle any extra action groups the agent might add
  for (const [key, val] of Object.entries(actions)) {
    if (['this_week', 'this_month', 'ninety_days'].includes(key)) continue;
    if (Array.isArray(val) && val.length) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const r = renderActionList(label, val, num);
      html += r.html;
      num = r.nextNum;
    }
  }

  html += `\n    </section>`;
  return html;
}

function renderContentStrategy(items) {
  if (!items?.length) return '';

  const cards = items.map(item => {
    const title = esc(item.title || '');
    const desc = item.description || '';
    return `        <div class="card">\n          <h3>${title}</h3>\n          <p>${desc}</p>\n        </div>`;
  }).join('\n');

  return `
    <section class="section">
      <h2>Content That Would Work for This Brand</h2>
      <div class="card-grid">
${cards}
      </div>
    </section>`;
}

function renderStrengths(items) {
  if (!items?.length) return '';

  const lis = items.map(s => `          <li>${s}</li>`).join('\n');

  return `
    <section class="section">
      <h2>Existing Strengths to Build On</h2>
      <div class="card">
        <ul>
${lis}
        </ul>
      </div>
    </section>`;
}

function renderClaudePrompt(prompt) {
  if (!prompt?.prompt_text) return '';

  return `
    <section class="section">
      <h2>Next Steps</h2>
      <p>This audit was done from the outside — public information only. When you're ready to act on it, copy the prompt below into Claude and it will walk you through the questions and help you fix things one by one.</p>
      <div class="card" style="position: relative;">
        <button onclick="copyPrompt()" id="copy-btn" style="position: absolute; top: 1rem; right: 1rem; background: var(--accent); color: white; border: none; border-radius: 6px; padding: 0.4rem 0.85rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.15s;">Copy prompt</button>
        <h3>Paste this into Claude</h3>
        <pre id="claude-prompt" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-top: 0.75rem; font-size: 0.8125rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; color: var(--text-secondary); max-height: 400px; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;">${esc(prompt.prompt_text)}</pre>
      </div>
    </section>`;
}

function renderFooter(meta) {
  const name = esc(meta?.business_name || '');
  const date = esc(meta?.generated || '');

  return `
    <footer class="report-footer">
      <p>${name} — Brand & Online Presence Audit.${date ? ` Prepared ${date}.` : ''} This audit is based entirely on publicly available information and does not include internal business data, analytics, or financial information.</p>
    </footer>`;
}

// ─── Copy-to-clipboard JS ──────────────────────────────────────────────

const COPY_JS = `
  function copyPrompt() {
    const text = document.getElementById('claude-prompt').textContent;
    navigator.clipboard.writeText(text).then(function() {
      var btn = document.getElementById('copy-btn');
      btn.textContent = 'Copied!';
      btn.style.background = '#2d8a4e';
      setTimeout(function() { btn.textContent = 'Copy prompt'; btn.style.background = ''; }, 2000);
    });
  }`;

// ─── Main ──────────────────────────────────────────────────────────────

function generateReport(data) {
  const { meta, executive_summary, findings, website, presence, actions, content_strategy, strengths, claude_prompt } = data;

  const hasPrompt = claude_prompt?.prompt_text;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(meta?.business_name || 'Brand Audit')} — Brand & Online Presence Audit</title>
  <style>${CSS}
  </style>
</head>
<body>
  <div class="container">
${renderHeader(meta, executive_summary)}
${renderExecutiveSummary(executive_summary)}
${renderScorecard(findings)}
${renderWebsiteOverview(website)}
${renderPresenceTable(presence)}

    <hr class="divider">
${renderFindings(findings)}

    <hr class="divider">
${renderActions(actions)}

    <hr class="divider">
${renderContentStrategy(content_strategy)}
${renderStrengths(strengths)}

    <hr class="divider">
${renderClaudePrompt(claude_prompt)}
${renderFooter(meta)}
  </div>${hasPrompt ? `\n  <script>${COPY_JS}\n  </script>` : ''}
</body>
</html>
`;
}

// ─── CLI ───────────────────────────────────────────────────────────────

function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    process.stderr.write('Usage: node scripts/generate-report.mjs <audit-data.json> [output-path]\n');
    process.exit(1);
  }

  const resolvedInput = resolve(inputPath);
  let data;
  try {
    data = JSON.parse(readFileSync(resolvedInput, 'utf8'));
  } catch (err) {
    process.stderr.write(`Error reading ${resolvedInput}: ${err.message}\n`);
    process.exit(1);
  }

  // Determine output path
  let outputPath = process.argv[3];
  if (!outputPath) {
    const slug = data.meta?.slug || data.meta?.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'audit';
    // Find project root by looking for package.json
    let projectDir = dirname(resolvedInput);
    for (let i = 0; i < 5; i++) {
      try {
        readFileSync(resolve(projectDir, 'package.json'));
        break;
      } catch { projectDir = resolve(projectDir, '..'); }
    }
    outputPath = resolve(projectDir, 'reports', slug, 'audit-report.html');
  } else {
    outputPath = resolve(outputPath);
  }

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  const html = generateReport(data);
  writeFileSync(outputPath, html, 'utf8');

  process.stderr.write(`Report generated: ${outputPath}\n`);
  process.stderr.write(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB\n`);
}

main();
