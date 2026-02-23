---
name: brand-audit
description: Research a small business's online presence, produce a discovery report, draft an HTML audit report, and deploy it. Use when the user wants to audit a brand, discover what a business looks like online, or compare against competitors.
version: 3.0.0
tools:
  - WebSearch
  - WebFetch
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - mcp__perplexity__perplexity_search
  - mcp__perplexity__perplexity_ask
  - mcp__perplexity__perplexity_research
---

# Brand Audit

## Commands

- `/brand-audit discover <url>` — automated data collection + Claude research → JSON + narrative
- `/brand-audit draft <slug>` — Claude adds judgment (scores, actions, summary) → generates HTML report
- `/brand-audit deploy <slug>` — Vercel deploy → live URL

Arguments are passed as `$ARGUMENTS`. Parse the command, URL/slug, and any flags.

## Project Location

The brand-audit-tool repo lives at: `/Users/andy/Cursor Projects 2026/brand-audit-tool/`

Scripts, schema, data, and reports all live in this repo. Read the `CLAUDE.md` there for full structure.

---

## Command: discover

`/brand-audit discover willow-leather.com`
`/brand-audit discover colampa.com --competitors "studio-ashby.com, sigmar.co.uk"`
`/brand-audit discover` — no URL: ask what business to research

### What This Does

You are researching a small business as if you were a prospective customer, a journalist, or a potential stockist trying to find out everything about them online. Your job is to see what the world sees — and to notice what's missing, what's broken, and what's good.

This is not a checklist exercise. Every business is different. A one-woman leather bag maker in Hertfordshire is nothing like a luxury interior architecture studio working across three countries. The channels that matter, the things that count as "good" or "bad", the competitors worth comparing against, and the tone of the findings should all reflect the actual business you're looking at.

### The Process

#### Step 1: Run the automated scripts

Run all three scripts in parallel to collect deterministic data:

```bash
PROJECT="/Users/andy/Cursor Projects 2026/brand-audit-tool"
SLUG="business-slug"  # derive from business name

mkdir -p "${PROJECT}/data/${SLUG}"

# Run in parallel
node "${PROJECT}/scripts/scan-website.mjs" "https://example.com" > "${PROJECT}/data/${SLUG}/website.json" 2>&1 &
node "${PROJECT}/scripts/check-presence.mjs" "Business Name" "business-handle" "example.com" > "${PROJECT}/data/${SLUG}/presence.json" 2>&1 &
node "${PROJECT}/scripts/check-pagespeed.mjs" "https://example.com" > "${PROJECT}/data/${SLUG}/pagespeed.json" 2>&1 &
wait
```

Read the outputs. These give you the factual foundation — platform, SSL, social links, PageSpeed score, Trustpilot/Pinterest/YouTube/Etsy/Companies House checks.

#### Step 2: Claude research

Use the script outputs as context. The scripts handle deterministic checks; now you do the judgment work:

- **Instagram, LinkedIn, TikTok, X** — platforms that block scripts. Use Perplexity: `"{business name}" site:instagram.com`
- **Google search results** — what appears when you search the business name? What they sell + location?
- **AI visibility** — would Perplexity or ChatGPT recommend this business?
- **Review sentiment** — pull actual quotes from reviews found
- **Competitors** — find 3-5 via Perplexity, confirm with user
- **Press and credentials** — verify claims, find coverage

#### Step 3: Build the audit-data.json

Write `data/{slug}/audit-data.json` with everything collected. The schema is at `schema/audit-data.schema.json` but it's deliberately flexible (`additionalProperties: true` everywhere). Structure it around what you actually found for this business.

**Key sections:** meta, website, presence, findings (array — you decide the categories), executive_summary, actions, content_strategy, strengths, claude_prompt.

**Leave scoring fields empty** if running discover only — the draft command adds judgment.

#### Step 4: Write the discovery narrative

Write `data/{slug}/discovery.md` — a readable briefing document covering what you found. This feeds into the draft phase.

Also print a summary to the conversation: key findings, biggest gaps, what to do next.

### How to Think About It

**Start with the business, not the channels.** Before you check a single URL, understand what the business is. Read the website. Get a feel for the person behind it. This context shapes everything.

**Think about the customer journey.** Someone hears about this business. They Google the name. What do they find? Follow that journey yourself and note where it breaks down.

**Check what matters, skip what doesn't.** A solo ceramicist doesn't need LinkedIn. A B2B consultancy doesn't need Pinterest. Focus your energy on channels that would actually move the needle.

**Actually look at what you find.** Don't just record "Instagram: 4,695 followers." Look at the content. Is the photography good? When was the last post? A stale account with 10,000 followers is worse than an active one with 500.

**Use judgment.** This entire skill is about looking at a business with fresh eyes and saying what you see.

---

## Command: draft

`/brand-audit draft willow-leather`

### What This Does

Takes the discovery data and adds Claude's judgment — scores, findings, prioritised actions, executive summary, content strategy, and a tailored Claude prompt. Then generates the HTML report.

### The Process

1. Read `data/{slug}/audit-data.json` and `data/{slug}/discovery.md`
2. Fill in the judgment fields:
   - **Scores (0-5)** for each finding category, with evidence arrays
   - **Executive summary** — core finding, opportunity, business context
   - **Prioritised actions** — this_week, this_month, ninety_days. Sorted by impact and effort.
   - **Content strategy** — realistic content ideas for this specific business
   - **Strengths** — what's genuinely good, acknowledged before the fixes
   - **Claude prompt** — tailored intake questions for the business owner
3. Save the completed `audit-data.json`
4. Generate the HTML report:

```bash
PROJECT="/Users/andy/Cursor Projects 2026/brand-audit-tool"
node "${PROJECT}/scripts/generate-report.mjs" "${PROJECT}/data/${SLUG}/audit-data.json"
```

5. Open the report in browser for review:

```bash
open "${PROJECT}/reports/${SLUG}/audit-report.html"
```

6. Tell the user: "Review the report. Edit audit-data.json to change scores/findings, then rerun generate. When ready: `/brand-audit deploy {slug}`"

### Judgment Guidelines

- Categories are not fixed. Choose 8-10 that make sense for this business.
- Scores should be honest. A 3 means "okay but could be better." A 1 means "this is a real problem." A 5 means "genuinely excellent."
- Actions should be specific and actionable by the business owner, not a marketer.
- The Claude prompt intake questions should be specific to the business type — a maker gets asked about capacity and materials, a service business gets asked about referral sources and case studies.

---

## Command: deploy

`/brand-audit deploy willow-leather`

### What This Does

Deploys the generated report to Vercel as a static site.

### The Process

```bash
PROJECT="/Users/andy/Cursor Projects 2026/brand-audit-tool"
bash "${PROJECT}/scripts/deploy.sh" "${SLUG}"
```

This:
1. Copies `audit-report.html` → `public/index.html`
2. Runs `vercel --yes --prod --name {slug}-audit`
3. Prints the live URL

After deploy, update the `audit-data.json` with the deployed URL:
- Set `meta.status` to `"deployed"`
- Set `meta.deployed_url` to the Vercel URL

Offer to commit + push to GitHub.

---

## Writing Rules

**Orwell's rules throughout.** No marketing jargon.

Banned words: "ICP", "CTA", "lead magnet", "social proof", "inbound marketing", "thought leadership", "table stakes", "conversion path", "revenue proximity", "SEO infrastructure", "leverage", "optimise" (when used vaguely), "ecosystem."

Write for the business owner, not a marketer. Plain English. Short sentences. Be direct about problems. Acknowledge what's genuinely good before listing what's wrong.

### Tone for Different Business Types

- **Solo makers / one-person operations**: Be realistic about what one person can do. Focus recommendations on 2-3 channels max.
- **Service businesses**: Focus on trust signals — reviews, case studies, process descriptions.
- **Product businesses**: Focus on discovery channels — Pinterest, SEO, marketplace presence.
- **All**: The Claude prompt at the bottom should have intake questions specific to the business type.

## Error Handling

- WebFetch fails on social platforms often. Fall back to Perplexity: `"{business name}" site:{platform}.com`
- Can't find a handle? Mark it as not found and note what you tried.
- Perplexity rate limited? Do WebFetch checks first, batch Perplexity at the end.
- PageSpeed API rate limited (429)? Note it and move on — can be run later.
- Competitors too hard to find? Ask the user.

## Reference Files

- `references/channels.md` — URL patterns and technical methods for checking each platform
- `references/competitor-comparison.md` — guidance on finding and presenting competitor data
- `references/template-structure.md` — HTML report template and design system
- `examples/discovery-output.md` — example of a completed discovery (Willow Leather)
