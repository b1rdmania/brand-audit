# Brand Audit Tool

Automated brand and online presence audits for small businesses. You give it a URL, it researches everything a prospective customer would find online, scores every category, and produces a report that looks like it came from a consultancy.

Each audit used to take around four hours of manual research. This brings it down to about thirty minutes of review.

![Architecture](docs/architecture.png)

---

## How It Works

1. **Scripts scan the surface** - website platform, PageSpeed, SSL, blog status, Trustpilot, Pinterest, YouTube, Etsy, Companies House
2. **Claude researches the rest** - Instagram, LinkedIn, TikTok, Google search visibility, AI tool citations, competitor landscape, review sentiment, press coverage
3. **Claude adds judgment** - scores each category 0-5 with evidence, writes an executive summary, prioritises actions by impact and effort, suggests content that would actually work for this business
4. **Generates the report** - self-contained HTML with editorial-quality typography and design
5. **Deploys to Vercel** - one command, live URL, ready to share

Everything flows through a single `audit-data.json` file. Scripts write to it, Claude enriches it, the report generator reads from it.

---

## Live Reports

| Business | What They Do | Report |
|----------|-------------|--------|
| Willow Leather | Handmade leather goods, solo maker in Hertfordshire | [willow-leather-audit.vercel.app](https://willow-leather-audit.vercel.app) |
| Bureau Bonanza | Design studio, Dublin/London | [bureau-bonanza-audit.vercel.app](https://bureau-bonanza-audit.vercel.app) |
| Near Mint | Vinyl record cleaning product | [near-mint-audit.vercel.app](https://near-mint-audit.vercel.app) |
| c/o Lampa | Luxury interior architecture | [colampa-audit.vercel.app](https://colampa-audit.vercel.app) |

---

## Report Design

Reports are designed to feel like a premium consultancy deliverable that a small business owner can actually absorb.

**Health score hero** with an SVG donut chart. **Horizontal bar scorecard** colour-coded red/amber/green. **Presence grid** with status dots grouped by active/stale/missing. **Collapsible findings** so you're not hit with a wall of text. **Colour-coded actions** - top three quick wins pulled out as hero cards, the rest grouped by timeframe with numbered circles. The business owner's first read should take about five minutes and leave them knowing exactly where they stand and what to do first.

Typography is Newsreader (serif, editorial authority) and Plus Jakarta Sans (modern, readable). Cream background, charcoal text, terracotta accent.

---

## Two Ways to Use It

### Claude Code Skill

Install the skill and run audits from the terminal:

```
/brand-audit discover https://example.com    # scripts + Claude research → JSON + narrative
/brand-audit draft example-business           # Claude adds judgment → HTML report
/brand-audit deploy example-business          # Vercel deploy → live URL
```

The skill handles everything - running scripts in parallel, doing the research that scripts can't handle, adding scores and findings, generating the report, and deploying it.

### React App

A browser-based dashboard for viewing and managing audits. Import `audit-data.json` files, browse reports with the same editorial design as the HTML exports, create new audits. Uses localStorage - no backend needed.

---

## The Pipeline

```
discover                          draft                        deploy
--------                          -----                        ------
+------------------+              +-------------------+        +----------+
| scan-website.mjs |--+           | Claude judgment   |        | deploy.sh|
| check-presence   |--+-> JSON -> | scores, findings  |-> HTML->| Vercel   |
| check-pagespeed  |--+           | actions, summary  |        | live URL |
| Claude+Perplexity|--+           | generate-report   |        +----------+
+------------------+              +-------------------+
```

Scripts handle deterministic work (HTML parsing, API calls, HTTP checks). Claude handles everything that needs judgment (scoring, writing, prioritisation, research on platforms that block scripts).

All scripts use zero external dependencies - Node.js built-ins only.

---

## Writing Rules

Reports follow Orwell's rules. No marketing jargon. Write for the business owner, not a marketer. Plain English. Short sentences. Be direct about problems. Acknowledge what's genuinely good before listing what's wrong.

**Banned:** "ICP", "CTA", "lead magnet", "social proof", "thought leadership", "table stakes", "leverage", "optimise" (when used vaguely).
