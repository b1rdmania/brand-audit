#!/usr/bin/env node

/**
 * generate-report.mjs
 *
 * Takes an audit-data.json file and produces a self-contained HTML report.
 * Redesigned for visual clarity — editorial consultancy aesthetic.
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

function scoreColor(score) {
  const n = parseInt(score, 10);
  if (isNaN(n) || n <= 1) return { bg: 'var(--red-light)', text: 'var(--red)', bar: 'var(--red)' };
  if (n <= 3) return { bg: 'var(--yellow-light)', text: 'var(--yellow)', bar: 'var(--yellow)' };
  return { bg: 'var(--green-light)', text: 'var(--green)', bar: 'var(--green)' };
}

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'claimed') return 'status-active';
  if (s === 'stale' || s === 'inactive') return 'status-stale';
  return 'status-missing';
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'claimed') return 'Active';
  if (s === 'stale' || s === 'inactive') return 'Stale';
  return 'Missing';
}

function channelIcon(channel) {
  const c = String(channel || '').toLowerCase();
  const map = {
    website: '&#xe903;', instagram: '&#xe901;', pinterest: '&#xe902;',
    facebook: '&#xe900;', tiktok: '&#xe904;', twitter: '&#xe905;',
    youtube: '&#xe906;', linkedin: '&#xe907;', etsy: '&#xe908;',
    trustpilot: '&#xe909;', google: '&#xe90a;',
  };
  // Fallback to first letter in a circle
  return null; // We'll use text-based icons instead
}

function averageScore(findings) {
  if (!findings?.length) return 0;
  const scored = findings.filter(f => f.score != null);
  if (!scored.length) return 0;
  const sum = scored.reduce((a, f) => a + parseInt(f.score, 10), 0);
  return sum / scored.length;
}

function gradeLabel(avg) {
  if (avg <= 1.5) return 'Needs Attention';
  if (avg <= 2.5) return 'Work to Do';
  if (avg <= 3.5) return 'Getting There';
  if (avg <= 4.5) return 'Looking Good';
  return 'Excellent';
}

function gradeColor(avg) {
  if (avg <= 1.5) return 'var(--red)';
  if (avg <= 2.5) return 'var(--yellow)';
  if (avg <= 3.5) return 'var(--yellow)';
  return 'var(--green)';
}

// ─── CSS ───────────────────────────────────────────────────────────────

const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-primary: #faf9f7;
      --bg-white: #ffffff;
      --bg-elevated: #fefefe;
      --text-primary: #131314;
      --text-secondary: #55555a;
      --text-tertiary: #9b9b9f;
      --accent: #d97757;
      --accent-light: #f5ebe6;
      --accent-soft: #faf0eb;
      --green: #2d8a4e;
      --green-light: #e6f4eb;
      --red: #c4442a;
      --red-light: #fce8e4;
      --yellow: #b8860b;
      --yellow-light: #fdf4e0;
      --border: #e8e8e5;
      --border-light: #f0efec;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02);
      --shadow-md: 0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
      --shadow-lg: 0 4px 12px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.04);
      --radius: 10px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-sans);
      line-height: 1.65;
      font-size: 0.9375rem;
      -webkit-text-size-adjust: 100%;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: clamp(2rem, 5vw, 5rem) clamp(1.25rem, 4vw, 3rem);
    }

    /* ─── Header ─── */

    .report-header {
      text-align: center;
      padding-bottom: 3.5rem;
      margin-bottom: 3.5rem;
      border-bottom: 1px solid var(--border);
    }

    .report-meta {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin-bottom: 1.25rem;
    }

    h1 {
      font-family: var(--font-serif);
      font-size: clamp(2.5rem, 5vw, 3.75rem);
      font-weight: 500;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: 1.25rem;
      color: var(--text-primary);
    }

    .report-url {
      display: inline-block;
      margin-top: 1.25rem;
      font-size: 0.8125rem;
      color: var(--text-tertiary);
    }

    .report-url a {
      color: var(--text-tertiary);
      text-decoration: none;
      border-bottom: 1px solid var(--border);
      transition: all 0.2s;
    }

    .report-url a:hover {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    /* ─── Executive Summary ─── */

    .exec-context {
      font-family: var(--font-serif);
      font-style: italic;
      color: var(--text-tertiary);
      font-size: 0.9375rem;
      line-height: 1.65;
      padding-left: 1.5rem;
      border-left: 2px solid var(--border-light);
    }

    /* ─── Section basics ─── */

    .section {
      margin-bottom: 4rem;
    }

    h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 500;
      letter-spacing: -0.015em;
      margin-bottom: 0.5rem;
      line-height: 1.2;
      color: var(--text-primary);
    }

    .section-intro {
      color: var(--text-tertiary);
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }

    h3 {
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }

    p {
      color: var(--text-secondary);
      margin-bottom: 0.875rem;
      font-size: 0.9375rem;
    }

    strong { color: var(--text-primary); font-weight: 600; }

    a {
      color: var(--accent);
      text-decoration: none;
      transition: opacity 0.15s;
    }

    a:hover { opacity: 0.75; }

    /* ─── Health Score Hero ─── */

    .health-hero {
      display: flex;
      align-items: center;
      gap: 3rem;
      margin-bottom: 4rem;
      padding: 2.5rem 3rem;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
    }

    .health-ring {
      flex-shrink: 0;
      position: relative;
      width: 160px;
      height: 160px;
    }

    .health-ring svg {
      transform: rotate(-90deg);
    }

    .health-ring-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .health-ring-score {
      font-family: var(--font-serif);
      font-size: 2.75rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .health-ring-max {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      font-weight: 500;
      margin-top: 0.125rem;
    }

    .health-summary {
      flex: 1;
    }

    .health-grade {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.3rem 0.75rem;
      border-radius: 100px;
      margin-bottom: 1rem;
    }

    .health-summary .finding-text {
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    /* ─── Scorecard bars ─── */

    .score-bars {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .score-row {
      display: grid;
      grid-template-columns: 180px 1fr 48px;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      transition: box-shadow 0.2s;
    }

    .score-row:hover {
      box-shadow: var(--shadow-sm);
    }

    .score-row-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .score-bar-track {
      height: 8px;
      background: var(--bg-primary);
      border-radius: 100px;
      overflow: hidden;
    }

    .score-bar-fill {
      height: 100%;
      border-radius: 100px;
      transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .score-row-value {
      font-size: 0.8125rem;
      font-weight: 600;
      text-align: right;
      white-space: nowrap;
    }

    /* ─── Website overview ─── */

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
    }

    .stat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-tertiary);
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-value small {
      font-size: 0.875rem;
      font-weight: 400;
      color: var(--text-tertiary);
    }

    .stat-note {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      margin-top: 0.25rem;
    }

    /* ─── Presence Grid ─── */

    .presence-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .presence-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.125rem;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      transition: box-shadow 0.2s;
    }

    .presence-card:hover {
      box-shadow: var(--shadow-sm);
    }

    .presence-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 0.4rem;
    }

    .presence-dot.active { background: var(--green); box-shadow: 0 0 0 3px var(--green-light); }
    .presence-dot.stale { background: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-light); }
    .presence-dot.missing { background: var(--red); box-shadow: 0 0 0 3px var(--red-light); }

    .presence-info {
      flex: 1;
      min-width: 0;
    }

    .presence-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.125rem;
    }

    .presence-name a {
      color: var(--text-primary);
      border-bottom: 1px solid transparent;
    }

    .presence-name a:hover {
      color: var(--accent);
      opacity: 1;
    }

    .presence-note {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .presence-section-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      margin-bottom: 0.75rem;
      margin-top: 1.5rem;
    }

    .presence-section-label:first-child {
      margin-top: 0;
    }

    /* ─── Findings accordion ─── */

    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .finding-item {
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }

    .finding-item[open] {
      box-shadow: var(--shadow-md);
    }

    .finding-item summary {
      display: grid;
      grid-template-columns: 1fr auto 40px;
      align-items: center;
      gap: 1rem;
      padding: 1.125rem 1.5rem;
      cursor: pointer;
      list-style: none;
      user-select: none;
    }

    .finding-item summary::-webkit-details-marker { display: none; }

    .finding-item summary::after {
      content: '';
      width: 8px;
      height: 8px;
      border-right: 2px solid var(--text-tertiary);
      border-bottom: 2px solid var(--text-tertiary);
      transform: rotate(45deg);
      transition: transform 0.2s;
      justify-self: center;
    }

    .finding-item[open] summary::after {
      transform: rotate(-135deg);
    }

    .finding-item summary:hover {
      background: var(--bg-primary);
    }

    .finding-cat {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .finding-score-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.65rem;
      border-radius: 100px;
      white-space: nowrap;
    }

    .finding-body {
      padding: 0 1.5rem 1.5rem;
      border-top: 1px solid var(--border-light);
    }

    .finding-body p {
      margin-top: 1.25rem;
      font-size: 0.9375rem;
      line-height: 1.65;
    }

    .finding-evidence {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .evidence-item {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }

    .evidence-item::before {
      content: '';
      flex-shrink: 0;
      width: 5px;
      height: 5px;
      background: var(--border);
      border-radius: 50%;
      margin-top: 0.5rem;
    }

    /* ─── Actions ─── */

    .quick-wins {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .quick-win-card {
      position: relative;
      background: var(--bg-white);
      border: 1px solid var(--accent);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }

    .quick-win-card::before {
      content: attr(data-number);
      position: absolute;
      top: -0.625rem;
      left: 1.25rem;
      width: 1.5rem;
      height: 1.5rem;
      background: var(--accent);
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quick-win-card h3 {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .quick-win-card p {
      font-size: 0.8125rem;
      line-height: 1.55;
      color: var(--text-secondary);
      margin-bottom: 0;
    }

    .quick-win-effort {
      display: inline-block;
      margin-top: 0.75rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-tertiary);
    }

    .action-group {
      margin-bottom: 2rem;
    }

    .action-group-title {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      margin-bottom: 0.875rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-light);
    }

    .action-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-item {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.55;
      align-items: start;
    }

    .action-num {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      color: var(--text-tertiary);
      border-radius: 50%;
      font-size: 0.6875rem;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 0.05rem;
    }

    .action-item strong { color: var(--text-primary); }

    .action-effort {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      font-weight: 500;
    }

    /* ─── Content cards ─── */

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }

    .content-card {
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.2s;
    }

    .content-card:hover {
      box-shadow: var(--shadow-md);
    }

    .content-card h3 {
      font-family: var(--font-serif);
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .content-card p {
      font-size: 0.8125rem;
      line-height: 1.55;
      color: var(--text-tertiary);
      margin-bottom: 0;
    }

    /* ─── Strengths ─── */

    .strengths-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .strength-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }

    .strength-check {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      background: var(--green-light);
      color: var(--green);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      margin-top: 0.1rem;
    }

    /* ─── Claude prompt ─── */

    .prompt-card {
      position: relative;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }

    .prompt-card h3 {
      font-family: var(--font-serif);
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .copy-btn {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: var(--text-primary);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.02em;
    }

    .copy-btn:hover {
      background: var(--accent);
    }

    .prompt-pre {
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-top: 1rem;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.8125rem;
      line-height: 1.65;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: var(--text-secondary);
      max-height: 400px;
      overflow-y: auto;
    }

    /* ─── Fix Nudge (after actions) ─── */

    .fix-nudge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
      background: var(--accent-soft);
      border: 1px solid var(--accent-light);
      border-radius: var(--radius-lg);
      margin-top: 2.5rem;
    }

    .fix-nudge-text {
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      color: var(--text-primary);
      line-height: 1.5;
    }

    .fix-nudge-text span {
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    .fix-nudge a {
      flex-shrink: 0;
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--cream, #faf9f7);
      background: var(--accent);
      padding: 0.75rem 1.75rem;
      border-radius: 4px;
      text-decoration: none;
      transition: background 0.2s, transform 0.15s;
      white-space: nowrap;
    }

    .fix-nudge a:hover { background: #c4684a; transform: translateY(-1px); opacity: 1; }

    @media (max-width: 700px) {
      .fix-nudge { flex-direction: column; text-align: center; padding: 1.25rem 1.5rem; }
    }

    /* ─── Fix Package ─── */

    .fix-package {
      background: var(--bg-white);
      border: 2px solid var(--accent);
      border-radius: var(--radius-xl);
      padding: 2.5rem 3rem;
      box-shadow: var(--shadow-md);
    }

    .fix-package-header {
      margin-bottom: 2rem;
    }

    .fix-package-header h2 {
      color: var(--accent);
      margin-bottom: 0.5rem;
    }

    .fix-package-header p {
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin-bottom: 0;
    }

    .fix-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .fix-column-label {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-light);
    }

    .fix-column-label.automate { color: var(--accent); border-bottom-color: var(--accent-light); }
    .fix-column-label.deliver { color: var(--yellow); border-bottom-color: var(--yellow-light); }
    .fix-column-label.followup { color: var(--green); border-bottom-color: var(--green-light); }

    .fix-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .fix-list li {
      font-size: 0.8125rem;
      line-height: 1.5;
      color: var(--text-secondary);
      padding-left: 1rem;
      position: relative;
    }

    .fix-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.45rem;
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    .fix-column.automate .fix-list li::before { background: var(--accent); }
    .fix-column.deliver .fix-list li::before { background: var(--yellow); }
    .fix-column.followup .fix-list li::before { background: var(--green); }

    .fix-cta {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-light);
    }

    .fix-cta a {
      display: inline-block;
      background: var(--accent);
      color: white;
      font-family: var(--font-sans);
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.875rem 2.5rem;
      border-radius: 4px;
      text-decoration: none;
      transition: background 0.2s, transform 0.15s;
    }

    .fix-cta a:hover { background: #c4684a; transform: translateY(-1px); opacity: 1; }

    .fix-cta p {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      margin-top: 0.75rem;
      margin-bottom: 0;
    }

    @media (max-width: 700px) {
      .fix-package { padding: 1.5rem; }
      .fix-columns { grid-template-columns: 1fr; gap: 1.5rem; }
    }

    /* ─── Divider ─── */

    .divider {
      border: none;
      height: 1px;
      background: var(--border);
      margin: 4rem 0;
    }

    /* ─── Footer ─── */

    .report-footer {
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      text-align: center;
    }

    /* ─── Responsive ─── */

    @media (max-width: 700px) {
      .health-hero {
        flex-direction: column;
        text-align: center;
        padding: 2rem 1.5rem;
        gap: 1.5rem;
      }
      .health-ring { width: 130px; height: 130px; }
      .health-ring-score { font-size: 2.25rem; }
      .score-row { grid-template-columns: 140px 1fr 44px; }
      .presence-grid { grid-template-columns: 1fr; }
      .quick-wins { grid-template-columns: 1fr; }
      .content-grid { grid-template-columns: 1fr; }
      h1 { font-size: 2rem; }
    }

    @media print {
      body { background: white; }
      .container { max-width: 100%; padding: 1rem; }
      .health-hero, .finding-item, .stat-card, .presence-card, .action-item, .content-card, .strength-item { box-shadow: none; }
      .finding-item[open] { box-shadow: none; }
      .copy-btn { display: none; }
    }
`;

// ─── Section Renderers ─────────────────────────────────────────────────

function renderHeader(meta) {
  const name = esc(meta?.business_name || 'Untitled Audit');
  const date = esc(meta?.generated || 'Draft');
  const url = meta?.url ? `<span class="report-url"><a href="${esc(meta.url)}" target="_blank">${esc(meta.url)}</a></span>` : '';

  return `
    <header class="report-header">
      <div class="report-meta">Brand &amp; Online Presence Audit &middot; ${date}</div>
      <h1>${name}</h1>
      ${url}
    </header>`;
}

function renderHealthHero(findings, executiveSummary) {
  if (!findings?.length) return '';

  const avg = averageScore(findings);
  const displayScore = avg.toFixed(1);
  const pct = (avg / 5) * 100;
  const label = gradeLabel(avg);
  const color = gradeColor(avg);

  // SVG donut chart
  const r = 68;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;
  const gap = circumference - filled;

  // Extract just the first sentence of the opportunity for the hero
  const oppText = executiveSummary?.opportunity || '';
  const firstSentence = oppText.split(/(?<=[.!?])\s+/)[0] || '';
  const opportunity = firstSentence
    ? `<p class="finding-text">${esc(firstSentence)}</p>`
    : '';

  return `
    <div class="health-hero">
      <div class="health-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="${r}" fill="none" stroke="var(--border-light)" stroke-width="10"/>
          <circle cx="80" cy="80" r="${r}" fill="none" stroke="${color}" stroke-width="10"
            stroke-dasharray="${filled.toFixed(1)} ${gap.toFixed(1)}"
            stroke-linecap="round"/>
        </svg>
        <div class="health-ring-label">
          <div class="health-ring-score" style="color: ${color}">${displayScore}</div>
          <div class="health-ring-max">out of 5</div>
        </div>
      </div>
      <div class="health-summary">
        <span class="health-grade" style="background: ${color}15; color: ${color}">${label}</span>
        ${opportunity}
      </div>
    </div>`;
}

function renderExecutiveSummary(summary) {
  if (!summary) return '';

  // Core finding is the main narrative. Opportunity already shown (first sentence) in the health hero.
  let html = `\n    <section class="section">`;

  if (summary.core_finding) {
    html += `\n      <p style="font-family: var(--font-serif); font-size: 1.0625rem; line-height: 1.7; color: var(--text-secondary);">${esc(summary.core_finding)}</p>`;
  }

  if (summary.business_context) {
    html += `\n      <p class="exec-context">${esc(summary.business_context)}</p>`;
  }

  html += `\n    </section>`;
  return html;
}

function renderScorecard(findings) {
  if (!findings?.length) return '';

  const items = findings
    .filter(f => f.score != null)
    .map(f => {
      const s = parseInt(f.score, 10);
      const pct = (s / 5) * 100;
      const c = scoreColor(s);
      return `        <div class="score-row">
          <span class="score-row-label">${esc(f.category)}</span>
          <div class="score-bar-track">
            <div class="score-bar-fill" style="width: ${pct}%; background: ${c.bar}"></div>
          </div>
          <span class="score-row-value" style="color: ${c.text}">${s}/5</span>
        </div>`;
    })
    .join('\n');

  return `
    <section class="section">
      <h2>Scorecard</h2>
      <p class="section-intro">Each category scored 0-5 based on publicly available information.</p>
      <div class="score-bars">
${items}
      </div>
    </section>`;
}

function renderWebsiteOverview(website) {
  if (!website) return '';

  let cards = '';

  if (website.platform) {
    cards += `\n        <div class="stat-card">
          <div class="stat-label">Platform</div>
          <div class="stat-value" style="font-size: 1.125rem">${esc(website.platform)}</div>
        </div>`;
  }
  if (website.pagespeed_mobile != null) {
    const ps = parseInt(website.pagespeed_mobile, 10);
    const psColor = ps >= 90 ? 'var(--green)' : ps >= 50 ? 'var(--yellow)' : 'var(--red)';
    cards += `\n        <div class="stat-card">
          <div class="stat-label">PageSpeed (Mobile)</div>
          <div class="stat-value" style="color: ${psColor}">${ps}<small> / 100</small></div>
        </div>`;
  }
  if (website.ssl != null) {
    cards += `\n        <div class="stat-card">
          <div class="stat-label">SSL Certificate</div>
          <div class="stat-value" style="font-size: 1.125rem; color: ${website.ssl ? 'var(--green)' : 'var(--red)'}">${website.ssl ? 'Valid' : 'Missing'}</div>
        </div>`;
  }
  if (website.blog) {
    const blogText = website.blog.detected
      ? `${website.blog.post_count || 0}`
      : '0';
    const blogNote = website.blog.detected && website.blog.last_post_date
      ? `Latest: ${esc(website.blog.last_post_date)}`
      : website.blog.detected ? `${website.blog.post_count || 0} post${(website.blog.post_count || 0) !== 1 ? 's' : ''} found` : 'Not detected';
    cards += `\n        <div class="stat-card">
          <div class="stat-label">Blog Posts</div>
          <div class="stat-value">${blogText}</div>
          <div class="stat-note">${blogNote}</div>
        </div>`;
  }

  if (!cards) return '';

  return `
    <section class="section">
      <h2>Website Overview</h2>
      <div class="stats-row">${cards}
      </div>
    </section>`;
}

function renderPresenceGrid(presence) {
  if (!presence?.length) return '';

  const active = presence.filter(p => {
    const s = String(p.status || '').toLowerCase();
    return s === 'active' || s === 'claimed';
  });
  const stale = presence.filter(p => {
    const s = String(p.status || '').toLowerCase();
    return s === 'stale' || s === 'inactive';
  });
  const missing = presence.filter(p => {
    const s = String(p.status || '').toLowerCase();
    return s !== 'active' && s !== 'claimed' && s !== 'stale' && s !== 'inactive';
  });

  function renderCard(p) {
    const status = String(p.status || 'missing').toLowerCase();
    const dotClass = (status === 'active' || status === 'claimed') ? 'active' : (status === 'stale' || status === 'inactive') ? 'stale' : 'missing';
    const name = esc(p.channel || p.platform || '');
    const nameHtml = p.url
      ? `<a href="${esc(p.url)}" target="_blank">${name}</a>`
      : name;
    const note = esc(p.notes || statusLabel(status));

    return `        <div class="presence-card">
          <div class="presence-dot ${dotClass}"></div>
          <div class="presence-info">
            <div class="presence-name">${nameHtml}</div>
            <div class="presence-note">${note}</div>
          </div>
        </div>`;
  }

  let html = `
    <section class="section">
      <h2>Presence Inventory</h2>
      <p class="section-intro">Where this brand shows up online - and where it doesn't.</p>`;

  if (active.length) {
    html += `\n      <div class="presence-section-label">Active (${active.length})</div>`;
    html += `\n      <div class="presence-grid">\n${active.map(renderCard).join('\n')}\n      </div>`;
  }

  if (stale.length) {
    html += `\n      <div class="presence-section-label">Stale (${stale.length})</div>`;
    html += `\n      <div class="presence-grid">\n${stale.map(renderCard).join('\n')}\n      </div>`;
  }

  if (missing.length) {
    html += `\n      <div class="presence-section-label">Missing (${missing.length})</div>`;
    html += `\n      <div class="presence-grid">\n${missing.map(renderCard).join('\n')}\n      </div>`;
  }

  html += `\n    </section>`;
  return html;
}

function renderFindings(findings) {
  if (!findings?.length) return '';

  const items = findings.map((f, i) => {
    const s = parseInt(f.score, 10);
    const c = scoreColor(s);

    let body = '';
    if (f.summary) {
      body += `\n          <p>${esc(f.summary)}</p>`;
    }
    if (f.evidence?.length) {
      body += `\n          <div class="finding-evidence">`;
      if (typeof f.evidence === 'string') {
        body += `\n            ${f.evidence}`;
      } else {
        for (const e of f.evidence) {
          body += `\n            <div class="evidence-item">${e}</div>`;
        }
      }
      body += `\n          </div>`;
    }

    return `      <details class="finding-item"${i === 0 ? ' open' : ''}>
        <summary>
          <span class="finding-cat">${esc(f.category)}</span>
          <span class="finding-score-pill" style="background: ${c.bg}; color: ${c.text}">${f.score != null ? f.score + '/5' : '-'}</span>
        </summary>
        <div class="finding-body">${body}
        </div>
      </details>`;
  }).join('\n');

  return `
    <section class="section">
      <h2>Scores &amp; Findings</h2>
      <p class="section-intro">Each category scored 0&ndash;5. Click to expand the evidence.</p>
      <div class="findings-list">
${items}
      </div>
    </section>`;
}

function renderActions(actions) {
  if (!actions) return '';

  // Gather all action groups with priority colours
  const groups = [];
  if (actions.this_week?.length) groups.push({ key: 'this_week', label: 'This week', sublabel: 'hours each', items: actions.this_week, color: 'var(--accent)', colorLight: 'var(--accent-light)' });
  if (actions.this_month?.length) groups.push({ key: 'this_month', label: 'This month', sublabel: '1-2 days each', items: actions.this_month, color: 'var(--yellow)', colorLight: 'var(--yellow-light)' });
  if (actions.ninety_days?.length) groups.push({ key: 'ninety_days', label: '90 days', sublabel: '1 week+ each', items: actions.ninety_days, color: 'var(--green)', colorLight: 'var(--green-light)' });

  // Handle extra groups
  for (const [key, val] of Object.entries(actions)) {
    if (['this_week', 'this_month', 'ninety_days'].includes(key)) continue;
    if (Array.isArray(val) && val.length) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      groups.push({ key, label, sublabel: '', items: val, color: 'var(--text-tertiary)', colorLight: 'var(--bg-primary)' });
    }
  }

  if (!groups.length) return '';

  let html = `\n    <section class="section">\n      <h2>What To Fix</h2>`;

  // Quick wins: first 3 items from this_week
  const quickWins = (actions.this_week || []).slice(0, 3);
  if (quickWins.length) {
    html += `\n      <p class="section-intro">Start with these three quick wins.</p>`;
    html += `\n      <div class="quick-wins">`;
    quickWins.forEach((a, i) => {
      const title = esc(a.title || String(a));
      const detail = a.detail ? esc(a.detail) : '';
      const effort = a.effort ? `<span class="quick-win-effort">Effort: ${esc(a.effort)}</span>` : '';
      html += `\n        <div class="quick-win-card" data-number="${i + 1}">
          <h3>${title}</h3>
          ${detail ? `<p>${detail}</p>` : ''}
          ${effort}
        </div>`;
    });
    html += `\n      </div>`;
  }

  // Full action list
  let num = quickWins.length ? 4 : 1; // Continue numbering after quick wins, or start at 1

  groups.forEach(group => {
    // Skip the quick-win items (first 3 of this_week)
    const items = group.key === 'this_week' ? group.items.slice(quickWins.length) : group.items;
    if (!items.length && group.key === 'this_week') return;

    const label = group.key === 'this_week' && quickWins.length
      ? `Also this week (${group.sublabel})`
      : `${group.label} (${group.sublabel})`;

    html += `\n      <div class="action-group">
        <div class="action-group-title" style="color: ${group.color}; border-bottom-color: ${group.colorLight}">${esc(label)}</div>
        <div class="action-list">`;

    (group.key === 'this_week' ? items : group.items).forEach(a => {
      const title = esc(a.title || String(a));
      const detail = a.detail ? ` ${esc(a.detail)}` : '';
      const effort = a.effort ? ` <span class="action-effort">(${esc(a.effort)})</span>` : '';
      html += `\n          <div class="action-item">
            <span class="action-num" style="background: ${group.colorLight}; color: ${group.color}">${num}</span>
            <div><strong>${title}</strong>${detail}${effort}</div>
          </div>`;
      num++;
    });

    html += `\n        </div>
      </div>`;
  });

  html += `\n    </section>`;
  return html;
}

function renderFixNudge(fixPackage) {
  if (!fixPackage) return '';

  return `
      <div class="fix-nudge">
        <div class="fix-nudge-text">
          Don't want to do this yourself? <span>We'll handle it.</span>
        </div>
        <a href="#fix-package">See how we'd fix it</a>
      </div>`;
}

function renderContentStrategy(items) {
  if (!items?.length) return '';

  const cards = items.map(item => {
    const title = esc(item.title || '');
    const desc = esc(item.description || '');
    return `        <div class="content-card">
          <h3>${title}</h3>
          <p>${desc}</p>
        </div>`;
  }).join('\n');

  return `
    <section class="section">
      <h2>Content That Would Work</h2>
      <p class="section-intro">Ideas matched to this brand's strengths and audience.</p>
      <div class="content-grid">
${cards}
      </div>
    </section>`;
}

function renderStrengths(items) {
  if (!items?.length) return '';

  const lis = items.map(s => `        <div class="strength-item">
          <span class="strength-check">&#10003;</span>
          <span>${s}</span>
        </div>`).join('\n');

  return `
    <section class="section">
      <h2>Strengths to Build On</h2>
      <div class="strengths-list">
${lis}
      </div>
    </section>`;
}

function renderClaudePrompt(prompt) {
  if (!prompt?.prompt_text) return '';

  return `
    <section class="section">
      <h2>Do it yourself</h2>
      <p>Want to tackle this on your own? Copy the prompt below into Claude and it will walk you through everything step by step.</p>
      <div class="prompt-card">
        <button onclick="copyPrompt()" id="copy-btn" class="copy-btn">Copy prompt</button>
        <h3>Paste this into Claude</h3>
        <pre class="prompt-pre" id="claude-prompt">${esc(prompt.prompt_text)}</pre>
      </div>
    </section>`;
}

function renderFixPackage(fixPackage) {
  if (!fixPackage) return '';

  const intro = fixPackage.intro || 'Based on this audit, here\'s how we\'d attack the fixes.';

  function renderColumn(items, label, className) {
    if (!items?.length) return '';
    const lis = items.map(item => `            <li>${esc(item)}</li>`).join('\n');
    return `
          <div class="fix-column ${className}">
            <div class="fix-column-label ${className}">${esc(label)}</div>
            <ul class="fix-list">
${lis}
            </ul>
          </div>`;
  }

  let html = `
    <section class="section" id="fix-package">
      <div class="fix-package">
        <div class="fix-package-header">
          <h2>Or let us fix it</h2>
          <p>${esc(intro)}</p>
        </div>
        <div class="fix-columns">`;

  html += renderColumn(fixPackage.we_automate, 'We automate', 'automate');
  html += renderColumn(fixPackage.we_deliver, 'We deliver to you', 'deliver');
  html += renderColumn(fixPackage.follow_up, 'Follow-up actions', 'followup');

  html += `
        </div>`;

  if (fixPackage.cta_url) {
    const ctaText = fixPackage.cta_text || 'Get the fixes — £499';
    const ctaNote = fixPackage.cta_note || 'Everything written in your voice. Delivered in a week.';
    html += `
        <div class="fix-cta">
          <a href="${esc(fixPackage.cta_url)}">${esc(ctaText)}</a>
          <p>${esc(ctaNote)}</p>
        </div>`;
  }

  html += `
      </div>
    </section>`;

  return html;
}

function renderFooter(meta) {
  const name = esc(meta?.business_name || '');
  const date = esc(meta?.generated || '');

  return `
    <footer class="report-footer">
      <p>${name} - Brand &amp; Online Presence Audit.${date ? ` Prepared ${date}.` : ''}<br>Based entirely on publicly available information.</p>
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
  const { meta, executive_summary, findings, website, presence, actions, content_strategy, strengths, claude_prompt, fix_package } = data;

  const hasPrompt = claude_prompt?.prompt_text;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(meta?.business_name || 'Brand Audit')} - Brand &amp; Online Presence Audit</title>
  <style>${CSS}
  </style>
</head>
<body>
  <div class="container">
${renderHeader(meta)}
${renderHealthHero(findings, executive_summary)}
${renderFixNudge(fix_package)}
${renderExecutiveSummary(executive_summary)}
${renderFindings(findings)}

    <hr class="divider">
${renderActions(actions)}

    <hr class="divider">
${renderWebsiteOverview(website)}
${renderPresenceGrid(presence)}

    <hr class="divider">
${renderContentStrategy(content_strategy)}
${renderStrengths(strengths)}

    <hr class="divider">
${renderFixPackage(fix_package)}

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
