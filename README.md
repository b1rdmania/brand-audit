# Brand Audit Tool

Automated brand and online presence audits for small businesses. You give it a URL, it researches everything a prospective customer would find online, scores every category, and produces a report that looks like it came from a consultancy.

Each audit used to take around four hours of manual research. This brings it down to about thirty minutes of review.

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

**Next: Self-serve audits** — API backend that chains the scripts and Claude API together. User enters a URL, gets a report back in 10-15 minutes. No Claude Code required. ~$2-5 in API cost per audit.

**Then: Automated fixes** — The audit tells you what's wrong. This step fixes it. Connect Shopify/WordPress OAuth and a Claude agent actions the quick wins directly:

| | Platform APIs | Claude API + Write | External Services |
|---|---|---|---|
| | Meta tags, OG, structured data | Product descriptions | Google Business Profile |
| | Broken pages, redirects | About / Story pages | Pinterest setup + pins |
| | Sitemap submission | Blog posts, guides, case studies | Trustpilot profile |
| | | | Testimonial request emails |

The audit becomes the sales tool. The implementation becomes the product. A business owner reads the report, clicks "fix these", and an agent does the work that would normally cost £500-2000 and take weeks.

---

## The Bigger Picture: Agent-Ready Brands

Search is changing. When someone asks ChatGPT "what's the best handmade leather bag brand in the UK" or asks Claude to "find me a design studio in Dublin", the answer depends on what's written online - structured data, detailed product pages, clear service descriptions, FAQs, proper metadata. Most small businesses have almost none of this.

The audit already scores AI discoverability. The next step is fixing it - not just for Google, but for the AI tools that are increasingly where people start. An agent that can rewrite product pages, add structured data, create FAQ sections, and build the kind of detailed written content that LLMs actually cite when recommending businesses.

This is the go-to-market for agents: make small businesses findable and recommendable by AI. Not "SEO" in the old sense - but making sure that when an AI agent is helping someone find a product, book a service, or compare options, the business actually shows up with enough context to be recommended.

---

## How to Use It

**Claude Code Skill** — install the skill, run audits from the terminal:

```
/brand-audit discover https://example.com
/brand-audit draft example-business
/brand-audit deploy example-business
```

**React App** — browser dashboard for viewing and managing audits. Import JSON, browse reports with the same editorial design. localStorage, no backend.
