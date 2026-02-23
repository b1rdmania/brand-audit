# Brand Audit Tool

## What This Is
Automated brand & online presence audit tool. Scripts collect data, Claude adds judgment (scores, findings, actions), `generate-report.mjs` produces a deployable HTML report. React frontend for managing audits.

## Project Structure
```
brand-audit-tool/
├── scripts/
│   ├── scan-website.mjs        # HTML parsing, platform detection, meta extraction
│   ├── check-pagespeed.mjs     # Google PageSpeed Insights API
│   ├── check-presence.mjs      # Trustpilot/Pinterest/Etsy/YouTube/Companies House
│   ├── generate-report.mjs     # audit-data.json → styled HTML report
│   └── deploy.sh               # Vercel deploy + alias
├── schema/
│   └── audit-data.schema.json  # Flexible JSON schema (additionalProperties: true)
├── data/                       # .gitignored — per-business working data
│   └── {slug}/
│       ├── website.json        # scan-website output
│       ├── pagespeed.json      # check-pagespeed output
│       ├── presence.json       # check-presence output
│       └── audit-data.json     # single source of truth
├── reports/                    # generated HTML reports
│   └── {slug}/
│       ├── audit-report.html
│       └── public/index.html
├── src/                        # React frontend (Vite)
└── templates/
    └── intake.md               # Intake questionnaire template
```

## Key Principle: Agent Autonomy
The schema uses `additionalProperties: true` everywhere. `findings` is an array where the agent decides categories — not a fixed list. Don't force rigid structures. Let the agent decide what matters per business.

## Scripts (zero external dependencies)
All scripts use Node.js built-ins only.

```bash
# Scan a website
node scripts/scan-website.mjs https://example.com > data/example/website.json

# Check PageSpeed (free API, no key needed)
node scripts/check-pagespeed.mjs https://example.com > data/example/pagespeed.json

# Check platform presence
node scripts/check-presence.mjs "Business Name" example.com > data/example/presence.json

# Generate HTML report from audit-data.json
node scripts/generate-report.mjs data/example/audit-data.json

# Deploy to Vercel
bash scripts/deploy.sh example
```

## Audit Pipeline
1. **discover** — run scripts + Claude research → populate audit-data.json
2. **draft** — Claude adds scores, findings, actions, executive summary → generate HTML
3. **deploy** — Vercel deploy → live URL

## Design System
- BG: #faf9f7 (cream), Text: #131314, Accent: #d97757 (terracotta)
- Scores 0-1: red, 2-3: yellow, 4-5: green
- Status badges: active (green), stale (yellow), missing (red)
- Responsive at 600px breakpoint

## Writing Rules
- Orwell's rules. No marketing jargon.
- Banned: "ICP", "CTA", "lead magnet", "social proof", "thought leadership", "table stakes", "leverage", "optimise" (vaguely)
- Write for the business owner, not a marketer. Plain English. Short sentences.
- Be direct about problems. Acknowledge strengths first.

## React Frontend
- Vite + React 19
- localStorage-based state (no backend)
- Design tokens in `src/lib/theme.js` and `src/App.css`
