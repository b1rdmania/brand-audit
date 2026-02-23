# Brand Audit Tool

Automated brand and online presence audits for small businesses. Researches everything a customer would find online, scores every aspect of a business's digital presence, generates a styled report, and deploys it to a live URL.

Each audit used to take ~4 hours of manual research. This tool brings it down to ~30 minutes of review.

![Architecture](docs/architecture.png)

---

## What This Does

You give it a URL. It:

1. **Scans the website** - platform detection, meta tags, social links, blog status, SSL, sitemap, scripts, review widgets, email capture tools, broken paths
2. **Checks platform presence** - Trustpilot, Pinterest, YouTube, Etsy, Facebook, Companies House. Generates handle variations and checks each
3. **Runs PageSpeed** - mobile performance score, Core Web Vitals, top 3 optimisation opportunities
4. **Claude researches the rest** - Instagram, LinkedIn, TikTok (platforms that block scripts), Google search results, AI visibility, competitor landscape, review sentiment, press coverage
5. **Claude adds judgment** - scores each category 0-5 with evidence, writes the executive summary, prioritises actions by impact and effort, suggests content strategy, drafts a tailored Claude prompt for the business owner
6. **Generates the report** - self-contained HTML with editorial-quality design
7. **Deploys to Vercel** - one command, live URL

The single `audit-data.json` file is the contract between every step. Scripts write to it, Claude enriches it, the generator reads from it.

---

## Report Design

Reports are designed to feel like a premium consultancy deliverable that a small business owner can actually absorb. Not a wall of text.

**Health score hero** - SVG donut chart showing the average score across all categories, with a grade label and one-sentence summary. Gives the emotional read before any detail.

**Scorecard** - horizontal bar charts for each category, colour-coded red/amber/green. Visual length communicates the score at a glance.

**Presence grid** - compact cards with coloured status dots, grouped by status (active, stale, missing). Replaces the traditional dense table.

**Collapsible findings** - accordion sections using `<details>`. First one open by default, rest collapsed. Click to expand evidence. No more walls of bullets.

**Colour-coded actions** - top 3 "this week" actions pulled out as quick-win hero cards with terracotta borders. Remaining actions grouped by timeframe with coloured number circles: terracotta (this week), amber (this month), green (90 days).

**Typography** - Newsreader serif for headings (editorial authority), Plus Jakarta Sans for body (modern, readable). Both loaded from Google Fonts.

**Design tokens** - cream background (#faf9f7), charcoal text (#131314), terracotta accent (#d97757), with green/amber/red for scoring.

---

## How to Use It

### Claude Code Skill

For people running Claude Code. Install the skill, then run audits from the terminal:

```
/brand-audit discover https://example.com
```

Runs all three scripts in parallel, then Claude does the research that scripts can't handle (Instagram, LinkedIn, Google search visibility, AI tool citations, competitors). Outputs `audit-data.json` + a narrative `discovery.md`.

```
/brand-audit draft example-business
```

Claude reads the discovery data and adds the judgment layer - scores with evidence, executive summary, prioritised actions, content strategy, strengths, and a business-specific Claude prompt. Then `generate-report.mjs` produces the HTML report.

```
/brand-audit deploy example-business
```

Pushes the report to Vercel. Prints the live URL.

The full skill definition is in [`skill/SKILL.md`](skill/SKILL.md). Reference files for channel patterns, competitor analysis, and template structure are in [`skill/references/`](skill/references/).

**To install the skill:** symlink or copy `skill/` to `~/.claude/skills/brand-audit/`.

### React App (not yet built)

The React frontend will be a dashboard for viewing and managing audits - importing JSON, browsing reports, sharing links. Component scaffolding exists in `src/` but hasn't been built out to match the current report design yet. The HTML report generator is the production path for now.

---

## The Pipeline

```
discover                          draft                        deploy
--------                          -----                        ------
+------------------+              +-------------------+         +----------+
| scan-website.mjs |--+          | Claude Judgment    |         | deploy.sh|
| check-presence   |--+-> audit-data.json -> | scores, findings  |-> HTML -> | Vercel   |
| check-pagespeed  |--+          | actions, summary   |         | live URL |
| Claude+Perplexity|--+          | generate-report    |         +----------+
+------------------+              +-------------------+
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

All scripts use **zero external dependencies** - Node.js built-ins only (`node:https`, `node:url`, `node:fs`).

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

Takes `audit-data.json`, produces a self-contained HTML report at `reports/{slug}/audit-report.html`. Single file, all CSS and JS inline, Google Fonts loaded via import. Includes copy-to-clipboard for the Claude prompt section.

### deploy.sh

```bash
bash scripts/deploy.sh willow-leather
```

Copies the HTML report to a `public/` directory and deploys via Vercel CLI. Creates `{slug}-audit.vercel.app`.

---

## Schema

The `audit-data.json` schema ([`schema/audit-data.schema.json`](schema/audit-data.schema.json)) is deliberately flexible - `additionalProperties: true` everywhere. The agent decides what categories to score, what findings to include, and what actions to prioritise. The schema is a guide, not a straitjacket.

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
│   ├── generate-report.mjs       # JSON -> editorial HTML report (zero deps)
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
├── src/                          # React frontend (scaffolded, not yet built)
├── docs/
│   └── architecture.png          # Architecture diagram
├── CLAUDE.md                     # Project docs for Claude Code
├── README.md
└── package.json
```

---

## Completed Audits

Live reports produced with this tool:

| Business | Type | Report |
|----------|------|--------|
| Willow Leather | Handmade leather goods, solo maker | [willow-leather-audit.vercel.app](https://willow-leather-audit.vercel.app) |
| Bureau Bonanza | Design agency, Dublin/London | [bureau-bonanza-audit.vercel.app](https://bureau-bonanza-audit.vercel.app) |
| Near Mint | Vinyl record cleaning product | [near-mint-audit.vercel.app](https://near-mint-audit.vercel.app) |
| c/o Lampa | Luxury interior architecture | [colampa-audit.vercel.app](https://colampa-audit.vercel.app) |

Note: Willow Leather and Bureau Bonanza use the current report design. Near Mint and c/o Lampa use an earlier version.

---

## Writing Rules

Reports follow Orwell's rules. No marketing jargon.

**Banned words:** "ICP", "CTA", "lead magnet", "social proof", "inbound marketing", "thought leadership", "table stakes", "conversion path", "leverage", "optimise" (when used vaguely), "ecosystem".

Write for the business owner, not a marketer. Plain English. Short sentences. Be direct about problems. Acknowledge what's genuinely good before listing what's wrong.
