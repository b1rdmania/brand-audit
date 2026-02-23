# Channel Reference

Technical reference for how to check each platform. This is the *how*, not the *what to check* — the skill itself decides which channels matter for each business.

## Social Platforms

### Instagram
- **URL:** `https://www.instagram.com/{handle}/`
- **Method:** WebFetch the profile URL. Often blocked — if so, use Perplexity: `"{business name}" instagram site:instagram.com`
- **Handle variations:** `{name}`, `{name.name}`, `{name_name}`, `{nameofficial}`
- **What's available:** Follower count, post count, bio text, profile link, recent post dates
- **Look for:** Bio content (do they explain what they sell?), link in bio (own site or Linktree?), posting frequency, content quality, engagement on recent posts

### Pinterest
- **URL:** `https://www.pinterest.co.uk/{handle}/` or `https://www.pinterest.com/{handle}/`
- **Method:** WebFetch the profile URL
- **Handle variations:** `{name}`, `{name_name}`, `{namename}`
- **What's available:** Follower count, board count, pin count, monthly views (sometimes)
- **Look for:** Board names (curated or default?), pin quality, whether they're pinning their own products or just saving others' content

### Facebook
- **URL:** `https://www.facebook.com/{handle}/`
- **Method:** WebFetch. Sometimes blocked — Perplexity fallback.
- **Handle variations:** `{name}`, `{namewithoutspaces}`, `{name.name}`
- **What's available:** Page exists, follower/like count, last post date, reviews if enabled

### TikTok
- **URL:** `https://www.tiktok.com/@{handle}`
- **Method:** WebFetch — frequently blocked. Perplexity: `"{business name}" tiktok`
- **What's available:** Follower count, video count, bio text

### YouTube
- **URL:** `https://www.youtube.com/@{handle}` or `https://www.youtube.com/c/{handle}`
- **Method:** WebFetch the channel URL
- **What's available:** Subscriber count, video count, last upload date, channel description

### Twitter / X
- **URL:** `https://x.com/{handle}`
- **Method:** WebFetch — often blocked. Perplexity: `"{business name}" twitter OR x.com`
- **What's available:** Follower count, last tweet date, bio text

### LinkedIn
- **Company URL:** `https://www.linkedin.com/company/{handle}/`
- **Personal URL:** `https://www.linkedin.com/in/{name}/`
- **Method:** LinkedIn blocks almost all scraping. Use Perplexity: `"{business name}" linkedin`
- **What's available via Perplexity:** Company page exists, employee count range, description, whether founder has a personal profile
- **Watch for:** Duplicate personal profiles, company page vs personal page confusion

### Threads
- **URL:** `https://www.threads.net/@{handle}`
- **Method:** WebFetch
- **What's available:** Follower count, post count

## Review Platforms

### Google Business Profile
- **Method:** Can't WebFetch directly. Use Perplexity: `"{business name}" {location} google reviews`
- **What's available:** Whether a listing is claimed, star rating, review count, address, categories, photos
- **Also try:** Google Maps search via Perplexity

### Trustpilot
- **URL:** `https://www.trustpilot.com/review/{domain}` (e.g., `trustpilot.com/review/willow-leather.com`)
- **Method:** WebFetch — 404 means no profile
- **What's available:** TrustScore, review count, star breakdown, sample review text

### On-site review widgets
- **Detect from website source:** Judge.me, Yotpo, Stamped.io, Loox, Okendo, Reviews.io
- **Note:** These reviews only exist on the business's own site — they're invisible to anyone who hasn't already found the website. Important distinction.

## Marketplaces

### Etsy
- **URL:** `https://www.etsy.com/shop/{handle}` or `https://www.etsy.com/uk/shop/{handle}`
- **Method:** WebFetch
- **What's available:** Product count, review count, star rating, sales count, "Star Seller" badge
- **Watch for:** Similarly-named shops that are different businesses

### Not On The High Street
- **URL:** `https://www.notonthehighstreet.com/partners/{handle}`
- **Method:** WebFetch
- **What's available:** Product count, profile text

### Holly & Co
- **URL:** `https://holly.co/storefront/{handle}`
- **Method:** WebFetch
- **What's available:** Product count, badges ("Female Founded" etc.), profile text

### Amazon Handmade
- **Method:** Perplexity: `"{business name}" amazon handmade`
- **What's available:** Store exists, product count, ratings

### Ankorstore (wholesale)
- **Method:** Perplexity: `"{business name}" ankorstore`
- **What's available:** Whether the brand is listed

## Directories

### Houzz
- **Method:** Perplexity: `"{business name}" houzz`
- **What's available:** Profile exists, project count, review count, badges

### Bark
- **URL:** `https://www.bark.com/en/gb/company/{handle}/`
- **Method:** Perplexity: `"{business name}" bark.com`
- **What's available:** Profile exists, review count

### BIID (British Institute of Interior Design)
- **Method:** Perplexity: `"{business name}" biid.org.uk`

### Dezeen
- **Method:** Perplexity: `"{business name}" dezeen`

### Yell
- **Method:** Perplexity: `"{business name}" yell.com`

### Industry-specific
- There's no master list — it depends on the business. Think about what directories exist for their industry and check the ones that matter.

## Other

### Companies House (UK businesses)
- **URL:** `https://find-and-update.company-information.service.gov.uk/`
- **Method:** Perplexity: `"{business name}" companies house`
- **What's available:** Registration date, registered address, officers, filing history

### Trade shows
- **Method:** Perplexity: `"{business name}" trade show OR exhibition OR fair OR market`
- **What's available:** Past and upcoming events, exhibitor profiles

### Press coverage
- **Method:** Perplexity: `"{business name}" {founder name} press OR feature OR article OR interview`
- **What's available:** Publication names, article URLs, dates, quotes
- **This is one of the most valuable checks.** Real press coverage is a strong signal — and if it exists but isn't on the website, that's always a finding.

### Saatchi Art (for artists)
- **URL:** `https://www.saatchiart.com/{handle}`
- **Method:** WebFetch

## PageSpeed Check

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile&category=performance" | python3 -c "
import sys, json
d = json.load(sys.stdin)
score = d['lighthouseResult']['categories']['performance']['score']
print(f'Mobile performance score: {int(score*100)}/100')
for audit in ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index']:
    a = d['lighthouseResult']['audits'].get(audit, {})
    if a: print(f'  {a.get(\"title\",audit)}: {a.get(\"displayValue\",\"n/a\")}')
"
```

This takes 10-15 seconds. Only run it if the website seems slow or has a lot of third-party scripts.

## Handle Guessing

When no social links are found on the website, try these variations:

1. Exact name without spaces: `willowleather`
2. Dotted: `willow.leather`
3. Hyphenated: `willow-leather`
4. Underscored: `willow_leather`
5. With common suffixes: `willowleatheruk`, `willowleathershop`, `willowleatherstudio`

If the first couple of guesses fail, switch to Perplexity search rather than brute-forcing. And always verify a found profile is actually the right business — check the bio, location, and content.
