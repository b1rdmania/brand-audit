# Brand Audit Tool

Automated brand and online presence audits. Research a business, score every aspect of their digital presence, generate a styled report, and deploy it.

Built for two workflows:
- **Claude Code skill** — run `/brand-audit discover <url>` from the terminal and get a complete audit
- **React app** — clients view their audit, browse findings, track actions

![Architecture](docs/architecture.png)

## How It Works

**Scripts** collect data automatically (website scanning, platform presence, PageSpeed). **Claude** adds the judgment — scores, findings, prioritised actions, executive summary. **generate-report.mjs** turns the JSON into a styled HTML report. **deploy.sh** pushes it to Vercel.

The single `audit-data.json` file is the contract between collection, judgment, and delivery.

## Two Ways to Use It

### 1. Claude Code Skill

Install the skill and run audits from Claude Code:

```
/brand-audit discover https://example.com     # collect data + research
/brand-audit draft example-business            # add scores, generate report
/brand-audit deploy example-business           # push to Vercel
```

The skill runs the scripts, does research via Perplexity, adds Claude's judgment, and produces the final report. The full skill definition is in `skill/SKILL.md`.

To install, symlink or copy `skill/` to `~/.claude/skills/brand-audit/`.

### 2. React App

The React frontend is a dashboard for viewing and managing audits:

```bash
npm install
npm run dev
```

Clients can:
- See all audits on the dashboard
- View the full report with scores, findings, presence inventory, and actions
- Import audit data via JSON paste
- Link through to the deployed Vercel report

## Scripts

All scripts use **zero external dependencies** — Node.js built-ins only.

```bash
# Scan a website — platform, meta, social links, blog, SSL, sitemap
node scripts/scan-website.mjs https://example.com

# Check platform presence — Trustpilot, Pinterest, YouTube, Etsy, Companies House
node scripts/check-presence.mjs "Business Name" "handle" "example.com"

# Google PageSpeed — mobile score, metrics, top opportunities
node scripts/check-pagespeed.mjs https://example.com

# Generate HTML report from audit data
node scripts/generate-report.mjs data/example/audit-data.json

# Deploy to Vercel
bash scripts/deploy.sh example
```

## Project Structure

```
brand-audit-tool/
├── skill/                      # Claude Code skill definition
│   ├── SKILL.md                # Skill with discover/draft/deploy commands
│   ├── references/             # Channel patterns, competitor guidance, template docs
│   └── examples/               # Example discovery output
├── scripts/
│   ├── scan-website.mjs        # Website scanner
│   ├── check-presence.mjs      # Platform presence checker
│   ├── check-pagespeed.mjs     # PageSpeed API wrapper
│   ├── generate-report.mjs     # JSON → styled HTML report
│   └── deploy.sh               # Vercel deployment
├── schema/
│   └── audit-data.schema.json  # Flexible JSON schema
├── data/                       # Per-business working data (.gitignored)
├── reports/                    # Generated HTML reports
├── src/                        # React frontend
│   ├── pages/                  # Dashboard + AuditView
│   ├── components/             # Scorecard, Findings, Actions, PresenceTable, etc.
│   └── lib/                    # Design tokens
└── docs/                       # Architecture diagram
```

## Design

Reports use a consistent design system across HTML and React:

- Background: `#faf9f7` (cream)
- Text: `#131314` (charcoal)
- Accent: `#d97757` (terracotta)
- Scores 0-1: red, 2-3: yellow, 4-5: green
- Status badges: active (green), stale (yellow), missing (red)

## Deployed Reports

| Business | URL |
|----------|-----|
| Bureau Bonanza | https://bureau-bonanza-audit.vercel.app |
| Near Mint | https://near-mint-audit.vercel.app |
| c/o Lampa | https://colampa-audit.vercel.app |
| Willow Leather | https://willow-leather-audit.vercel.app |
