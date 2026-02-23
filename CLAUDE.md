# Brand Audit Tool

## What This Is
AI-powered brand audit and fix service for small businesses. We audit online presence, produce a scored report, and fix what's broken — manually for now, automated later.

**Live site**: https://brand-audits.vercel.app
**GitHub**: https://github.com/b1rdmania/brand-audit

## Current Phase: Manual Delivery
We're doing the first 3-4 clients for free to learn what's hard, what takes time, and what clients actually care about. No APIs, no automation — just the audit pipeline + manual fixes.

### Per-client workflow
1. **Audit** — run the scripts, Claude adds judgment, generate report
2. **Deliver report** — deploy to Vercel, share URL with client
3. **Do the fixes manually** — log into their platforms, make the changes
4. **Track time** — note how long each task takes so we know what £499 costs us
5. **Get feedback** — what was useful, what wasn't, would they pay

### What we actually do for each client (the £499 package)
**We do:**
- Rewrite every meta title & description
- Add JSON-LD structured data to pages
- Rewrite product & service descriptions
- Rewrite About page
- Write case studies from existing work
- Set up & optimise Google Business profile
- Write social bios for every platform
- Submit to directories & review sites
- Fix Shopify SEO, sitemap & 404 issues
- Create content pages they're missing

**We guide them through:**
- Google Business photos & pin
- Connecting platform accounts they own
- Adding portfolio/product images
- Requesting testimonials (we write the email)
- Creating accounts on missing platforms
- Anything that needs their login

**Everything written in their voice** — we analyse existing copy first and build a voice profile.

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
├── landing/                    # Marketing site (brand-audits.vercel.app)
│   ├── index.html
│   ├── how-it-works.html
│   ├── og.jpg
│   └── vercel.json
├── src/                        # React frontend (Vite) — not yet rebuilt
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

# Deploy to Vercel (uses correct project linking)
bash scripts/deploy.sh example
```

## Audit Pipeline
1. **discover** — run scripts + Claude research → populate audit-data.json
2. **draft** — Claude adds scores, findings, actions, executive summary → generate HTML
3. **deploy** — `bash scripts/deploy.sh {slug}` → live at {slug}-audit.vercel.app

## Deployed Reports
| Slug | URL |
|------|-----|
| willow-leather | https://willow-leather-audit.vercel.app |
| near-mint | https://near-mint-audit.vercel.app |
| bureau-bonanza | https://bureau-bonanza-audit.vercel.app |
| colampa | https://colampa-audit.vercel.app |

## Design System
- BG: #faf9f7 (cream), Text: #131314, Accent: #d97757 (terracotta)
- Fonts: Newsreader (serif headings), Plus Jakarta Sans (body)
- Scores 0-1: red, 2-3: yellow, 4-5: green
- Status badges: active (green), stale (yellow), missing (red)
- Responsive at 700px breakpoint
- Report structure: intro block (score + summary + nudge) → findings → actions → website → presence → content → strengths → fix package → claude prompt → bottom CTA → footer

## Writing Rules
- Orwell's rules. No marketing jargon.
- Banned: "ICP", "CTA", "lead magnet", "social proof", "thought leadership", "table stakes", "leverage", "optimise" (vaguely)
- Write for the business owner, not a marketer. Plain English. Short sentences.
- Be direct about problems. Acknowledge strengths first.

## Deployment
- Landing page: `cd landing && vercel --prod --yes` → brand-audits.vercel.app
- Reports: `bash scripts/deploy.sh {slug}` → {slug}-audit.vercel.app
- IMPORTANT: Don't deploy from `reports/{slug}/public/` directly — use deploy.sh which runs from the report root and links to the correct Vercel project

## What to Build Next (only after manual clients are done)
1. Stripe payment link on the £499 button
2. Proper intake form (business name, URL, platform access)
3. API automations for repetitive tasks (Shopify Admin, Google Business Profile, Pinterest)
4. Self-serve audit pipeline (user enters URL, gets report automatically)
5. Client dashboard (Clerk + database) — only when scaling
