# Brand Audit Tool

Automated brand and online presence audits for small businesses. Researches everything a customer would find online, scores every aspect of a business's digital presence, generates a styled report, and deploys it to a live URL.

Each audit used to take ~4 hours of manual research. This tool brings it down to ~30 minutes of review.

![Architecture](docs/architecture.png)

---

## What This Does

You give it a URL. It:

1. **Scans the website** — platform detection, meta tags, social links, blog status, SSL, sitemap, scripts, review widgets, email capture tools, broken paths
2. **Checks platform presence** — Trustpilot, Pinterest, YouTube, Etsy, Facebook, Companies House. Generates handle variations and checks each
3. **Runs PageSpeed** — mobile performance score, Core Web Vitals, top 3 optimisation opportunities
4. **Claude researches the rest** — Instagram, LinkedIn, TikTok (platforms that block scripts), Google search results, AI visibility, competitor landscape, review sentiment, press coverage
5. **Claude adds judgment** — scores each category 0-5 with evidence, writes the executive summary, prioritises actions by impact and effort, suggests content strategy, drafts a tailored Claude prompt for the business owner
6. **Generates the report** — self-contained HTML with the exact same design system as the manually-crafted originals
7. **Deploys to Vercel** — one command, live URL

The single `audit-data.json` file is the contract between every step. Scripts write to it, Claude enriches it, the generator reads from it, the React app displays it.

---

## Two Ways to Use It

### Option 1: Claude Code Skill

For people running Claude Code. Install the skill, then run audits from the terminal:

```
/brand-audit discover https://willow-leather.com
```

This runs all three scripts in parallel, then Claude does the research that scripts can't handle (Instagram, LinkedIn, Google search visibility, AI tool citations, competitors). Outputs `audit-data.json` + a narrative `discovery.md`.

```
/brand-audit draft willow-leather
```

Claude reads the discovery data and adds the judgment layer — scores with evidence, executive summary, prioritised actions (this week / this month / 90 days), content strategy, existing strengths, and a business-specific Claude prompt. Then `generate-report.mjs` produces the HTML report and opens it in the browser for review.

```
/brand-audit deploy willow-leather
```

Pushes the report to Vercel. Prints the live URL. Updates the JSON with the deployed URL.

The full skill definition is in [`skill/SKILL.md`](skill/SKILL.md). Reference files for channel patterns, competitor analysis, and template structure are in [`skill/references/`](skill/references/).

**To install the skill:** symlink or copy `skill/` to `~/.claude/skills/brand-audit/`.

### Option 2: React App

The React frontend is a dashboard for viewing and managing audits. Clients see their report rendered in the app — scores, findings, presence inventory, actions, everything.

```bash
npm install
npm run dev
```

**Dashboard** — lists all audits with status (intake / discovered / drafted / deployed), average score, and quick links.

**Audit View** — the full report: executive summary with callout blocks, scorecard grid, website overview cards, presence inventory table with status badges, detailed findings with evidence, prioritised action lists with numbered items, content strategy cards, existing strengths, and a copy-to-clipboard Claude prompt for the business owner to self-serve fixes.

**JSON Import** — paste `audit-data.json` contents directly into the app to load an audit. No backend needed — everything runs from localStorage.

---

## The Pipeline

```
discover                          draft                        deploy
────────                          ─────                        ──────
┌─────────────────┐              ┌──────────────────┐         ┌──────────┐
│ scan-website.mjs │──┐          │ Claude Judgment   │         │ deploy.sh│
│ check-presence   │──┼──> audit-data.json ──> │ scores, findings │──> HTML ──> │ Vercel   │
│ check-pagespeed  │──┤          │ actions, summary  │         │ live URL │
│ Claude+Perplexity│──┘          │ generate-report   │         └──────────┘
└─────────────────┘              └──────────────────┘
```

**What's a script vs what stays in Claude:**

| Task | Script | Claude | Why |
|------|:------:|:------:|-----|
| HTML parsing, platform detection | x | | Deterministic, fast |
| PageSpeed API | x | | Pure API call |
| Trustpilot/Pinterest/YouTube/Etsy checks | x | | HTTP status checks |
| Instagram/LinkedIn/TikTok | | x | Platforms block scripts |
| Review sentiment analysis | | x | Needs judgment |
| Scoring (0-5) | | x | Core judgment call |
| Evidence summaries | | x | Writing quality matters |
| Action prioritisation | | x | Business context needed |
| Executive summary | | x | Most important prose |
| HTML report assembly | x | | Mechanical once JSON exists |
| Deployment | x | | Pure CLI |

---

## Scripts

All scripts use **zero external dependencies** — Node.js built-ins only (`node:https`, `node:url`, `node:fs`).

### scan-website.mjs

```bash
node scripts/scan-website.mjs https://willow-leather.com
```

Fetches the homepage and key paths. Extracts: title, meta descriptions, platform fingerprint (Shopify/Squarespace/WordPress/Wix/Webflow), social links, external scripts, structured data (JSON-LD), contact info, copyright year, SSL status, sitemap page count, blog detection with post count, review widgets (Judge.me, Yotpo, Trustpilot, etc.), email capture tools (Mailchimp, Klaviyo, ConvertKit, etc.), broken paths (/about, /contact, /services, /blog, /faq).

### check-presence.mjs

```bash
node scripts/check-presence.mjs "Willow Leather" "willow-leather" "willow-leather.com"
```

Takes business name, primary handle, and domain. Generates handle variations (exact, dotted, joined, underscored). Checks in parallel: Trustpilot (extracts rating + review count), Pinterest, YouTube, Etsy, Facebook.

### check-pagespeed.mjs

```bash
node scripts/check-pagespeed.mjs https://willow-leather.com
```

Wraps Google PageSpeed Insights API (free, no key needed). Returns: mobile performance score (0-100), Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index), top 3 optimisation opportunities sorted by potential savings.

### generate-report.mjs

```bash
node scripts/generate-report.mjs data/willow-leather/audit-data.json
```

Takes `audit-data.json`, produces a self-contained HTML report at `reports/{slug}/audit-report.html`. The output is identical in design to the manually-crafted originals — same CSS, same components, same typography, same colour system. Includes a copy-to-clipboard button for the Claude prompt.

### deploy.sh

```bash
bash scripts/deploy.sh willow-leather
```

Copies the HTML report to a `public/` directory and deploys via Vercel CLI. Creates `{slug}-audit.vercel.app`.

---

## Schema

The `audit-data.json` schema ([`schema/audit-data.schema.json`](schema/audit-data.schema.json)) is deliberately flexible — `additionalProperties: true` everywhere. The agent decides what categories to score, what findings to include, and what actions to prioritise. The schema is a guide, not a straitjacket.

Key sections: `meta`, `website`, `presence[]`, `findings[]` (agent-chosen categories with scores and evidence), `actions` (this_week/this_month/ninety_days), `content_strategy[]`, `strengths[]`, `executive_summary`, `claude_prompt`.

---

## Project Structure

```
brand-audit-tool/
├── skill/                        # Claude Code skill
│   ├── SKILL.md                  # discover / draft / deploy commands
│   ├── references/
│   │   ├── channels.md           # Platform URL patterns + check methods
│   │   ├── competitor-comparison.md
│   │   └── template-structure.md # Report design system reference
│   └── examples/
│       └── discovery-output.md   # Example completed discovery
├── scripts/
│   ├── scan-website.mjs          # Website scanner (zero deps)
│   ├── check-presence.mjs        # Platform presence checker (zero deps)
│   ├── check-pagespeed.mjs       # PageSpeed API wrapper (zero deps)
│   ├── generate-report.mjs       # JSON → styled HTML report (zero deps)
│   └── deploy.sh                 # Vercel deployment
├── schema/
│   └── audit-data.schema.json    # Flexible JSON schema
├── data/                         # Per-business working data (.gitignored)
│   └── {slug}/
│       ├── website.json          # scan-website output
│       ├── pagespeed.json        # check-pagespeed output
│       ├── presence.json         # check-presence output
│       └── audit-data.json       # Single source of truth
├── reports/                      # Generated HTML reports
│   └── {slug}/
│       └── audit-report.html
├── src/                          # React frontend (Vite + React 19)
│   ├── App.jsx                   # Root with localStorage state
│   ├── App.css                   # Full design system
│   ├── lib/theme.js              # Design tokens + helpers
│   ├── pages/
│   │   ├── Dashboard.jsx         # Audit list + create
│   │   └── AuditView.jsx        # Full report view + JSON import
│   └── components/
│       ├── ExecutiveSummary.jsx   # Callout blocks
│       ├── Scorecard.jsx         # Score grid
│       ├── PresenceTable.jsx     # Channel inventory table
│       ├── Findings.jsx          # Detailed findings cards
│       ├── Actions.jsx           # Prioritised action lists
│       ├── ContentStrategy.jsx   # Content suggestion cards
│       ├── ScoreBadge.jsx        # Score colour coding (0-5)
│       └── StatusBadge.jsx       # Status indicators
├── docs/
│   └── architecture.png          # Architecture diagram
├── CLAUDE.md                     # Project docs for Claude Code
├── README.md
└── package.json
```

---

## Design System

The same design system runs across the HTML reports and the React app:

| Token | Value | Use |
|-------|-------|-----|
| `--bg-primary` | `#faf9f7` | Cream background |
| `--text-primary` | `#131314` | Charcoal headings |
| `--text-secondary` | `#6b6b6f` | Body text |
| `--text-tertiary` | `#9b9b9f` | Meta text |
| `--accent` | `#d97757` | Terracotta links, callouts, priority numbers |
| `--green` | `#2d8a4e` | Active/good (scores 4-5) |
| `--yellow` | `#b8860b` | Warning (scores 2-3) |
| `--red` | `#c4442a` | Missing/broken (scores 0-1) |

---

## Completed Audits

These are live reports produced with this tool and its predecessors:

| Business | Type | Report |
|----------|------|--------|
| Willow Leather | Handmade leather goods, solo maker | [willow-leather-audit.vercel.app](https://willow-leather-audit.vercel.app) |
| Near Mint | Vinyl record cleaning product | [near-mint-audit.vercel.app](https://near-mint-audit.vercel.app) |
| c/o Lampa | Luxury interior architecture | [colampa-audit.vercel.app](https://colampa-audit.vercel.app) |
| Bureau Bonanza | Design agency, Dublin/London | [bureau-bonanza-audit.vercel.app](https://bureau-bonanza-audit.vercel.app) |

---

## Writing Rules

Reports follow Orwell's rules. No marketing jargon.

**Banned words:** "ICP", "CTA", "lead magnet", "social proof", "inbound marketing", "thought leadership", "table stakes", "conversion path", "leverage", "optimise" (when used vaguely), "ecosystem".

Write for the business owner, not a marketer. Plain English. Short sentences. Be direct about problems. Acknowledge what's genuinely good before listing what's wrong.
