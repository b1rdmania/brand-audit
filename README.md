# Brand Audit Tool

Most small businesses are invisible to AI. Their product pages are thin, their metadata is missing, their story isn't written down anywhere an LLM can find it. When someone asks ChatGPT for a recommendation, these businesses don't exist. And the owner was never going to fix that. They're not going to learn structured data, meta tags, and how LLMs decide what to recommend. At best they're using ChatGPT like an advanced Google to get holiday tips. They're not fixing this shit themselves.

This tool audits that gap and closes it. Give it a URL, get back a report scoring every dimension of online presence — not just for Google, but for the AI agents that are replacing it. Then fix what's broken, automatically.

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

## Roadmap

**Now** — Claude Code skill runs the full pipeline. React app displays reports.

**Next: Self-serve audits** — API backend that chains the scripts and Claude API. User enters a URL, gets a report back in 10-15 minutes. ~$2-5 in API cost per audit.

**Then: Automated fixes** — The audit tells you what's wrong. This step fixes it. A business owner reads the report, clicks "fix these", and a Claude agent does the work — fixing meta tags, setting up Google Business, submitting sitemaps. These aren't people who were going to learn SEO and structured data on their own. They run a business. If it hasn't happened in five years, it's not going to happen now — unless someone (or something) just does it for them.

All generated content runs through a brand voice extraction first. The agent analyses existing copy — website, blog posts, social captions, however the owner actually writes — and builds a voice profile before producing anything. New product descriptions, About pages, and blog posts sound like the business owner wrote them, not like AI.

![Fix Engine](docs/fix-engine.png)

The end goal is agent-ready brands. When someone asks ChatGPT to find a leather bag maker in the UK or asks Claude for a design studio in Dublin, the businesses we've audited and fixed actually show up — with enough context to be recommended. That's the new SEO.

---

## How to Use It

**Claude Code Skill** — install the skill, run audits from the terminal:

```
/brand-audit discover https://example.com
/brand-audit draft example-business
/brand-audit deploy example-business
```

**React App** — browser dashboard for viewing and managing audits. Import JSON, browse reports with the same editorial design. localStorage, no backend.
