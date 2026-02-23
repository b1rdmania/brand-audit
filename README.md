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

Scripts handle deterministic work (HTML parsing, API calls, HTTP checks). Claude handles everything that needs judgment - scoring, writing, prioritisation, and research on platforms that block scripts. Everything flows through a single `audit-data.json` file. All scripts use zero external dependencies.

---

## Two Ways to Use It

**Claude Code Skill** - install the skill, run audits from the terminal:

```
/brand-audit discover https://example.com
/brand-audit draft example-business
/brand-audit deploy example-business
```

**React App** - browser dashboard for viewing and managing audits. Import JSON, browse reports with the same editorial design, create new audits. localStorage, no backend.

---

## Writing Rules

Orwell's rules. No marketing jargon. Write for the business owner, not a marketer. Plain English. Short sentences. Be direct about problems. Acknowledge what's genuinely good first.
