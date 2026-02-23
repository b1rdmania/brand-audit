# Brand Audit Tool

Most small businesses are invisible to AI. Their product pages are thin, their metadata is missing, their story isn't written down anywhere an LLM can find it. When someone asks ChatGPT for a recommendation, these businesses don't exist.

This tool audits that gap and closes it. Give it a URL, get back a scored report covering every dimension of online presence — not just for Google, but for the AI agents that are replacing it. Then fix what's broken, automatically.

**[brand-audits.vercel.app](https://brand-audits.vercel.app)**

![Architecture](docs/architecture.png)

---

## Live Reports

| Business | What They Do | Report |
|----------|-------------|--------|
| Willow Leather | Handmade leather goods, solo maker | [willow-leather-audit.vercel.app](https://willow-leather-audit.vercel.app) |
| Bureau Bonanza | Design studio, Dublin/London | [bureau-bonanza-audit.vercel.app](https://bureau-bonanza-audit.vercel.app) |
| Near Mint | Vinyl record cleaning + record fairs | [near-mint-audit.vercel.app](https://near-mint-audit.vercel.app) |
| c/o Lampa | Luxury interior architecture | [colampa-audit.vercel.app](https://colampa-audit.vercel.app) |

---

## How It Works

1. **Audit** — Scripts scan the website, check PageSpeed, and map presence across platforms (Google Business, Trustpilot, Pinterest, Etsy, YouTube, Companies House). Claude analyses the raw data and scores each category.

2. **Report** — A single-page HTML report with health score, scored findings, prioritised actions, and a full presence grid. Not a PDF. A page you can actually read.

3. **Fix** — A Claude agent rewrites product descriptions, fixes meta tags, adds structured data, sets up Google Business — in the business owner's voice. What can be done via API gets automated. What can't gets delivered as a guide.

---

## Roadmap

**Now** — Claude Code skill runs the full pipeline. Landing page live. Reports deployed per business.

**Next** — Self-serve audits. API backend that chains the scripts and Claude API. User enters a URL, gets a report back in 10-15 minutes. ~$2-5 in API cost per audit.

**Then** — Automated fix packages. The audit tells you what's wrong. The fix engine handles it. Shopify Admin API for product pages, Google Business Profile API for listings, structured data injection, content generation in the owner's voice.

All generated content runs through voice extraction first. The agent analyses existing copy — website, blog, social — and builds a voice profile before producing anything. It sounds like the owner wrote it, not like AI.

![Fix Engine](docs/fix-engine.png)

---

## Usage

**Claude Code Skill** — install the skill, run audits from the terminal:

```
/brand-audit discover https://example.com
/brand-audit draft example-business
/brand-audit deploy example-business
```

**React App** — browser dashboard for viewing and managing audits. Import JSON, browse reports with the same editorial design.

---

Built by [AutonoLabs](https://github.com/b1rdmania/brand-audit)
