#!/usr/bin/env node

/**
 * scan-website.mjs
 *
 * Zero-dependency website scanner. Uses only Node.js built-in modules.
 * Outputs a JSON brand-audit object to stdout.
 *
 * Usage: node scripts/scan-website.mjs https://example.com
 */

import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

const SOCIAL_DOMAINS = [
  "instagram.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "pinterest.com",
  "youtube.com",
  "tiktok.com",
];

const COMMON_PATHS = [
  "/about",
  "/contact",
  "/services",
  "/blog",
  "/faq",
  "/privacy-policy",
  "/terms",
];

const REVIEW_SIGNATURES = [
  { name: "Judge.me", pattern: /judge\.me|judgeme/i },
  { name: "Yotpo", pattern: /yotpo/i },
  { name: "Trustpilot", pattern: /trustpilot/i },
  { name: "Stamped", pattern: /stamped\.io/i },
  { name: "Loox", pattern: /loox\.io/i },
  { name: "Okendo", pattern: /okendo/i },
  { name: "Reviews.io", pattern: /reviews\.io/i },
  { name: "Bazaarvoice", pattern: /bazaarvoice/i },
  { name: "PowerReviews", pattern: /powerreviews/i },
  { name: "Feefo", pattern: /feefo/i },
  { name: "Google Reviews", pattern: /google.*review/i },
];

const EMAIL_CAPTURE_SIGNATURES = [
  { name: "Mailchimp", pattern: /mailchimp|list-manage\.com|mc\.us/i },
  { name: "Klaviyo", pattern: /klaviyo/i },
  { name: "ConvertKit", pattern: /convertkit/i },
  { name: "ActiveCampaign", pattern: /activecampaign/i },
  { name: "Omnisend", pattern: /omnisend/i },
  { name: "Drip", pattern: /getdrip\.com/i },
  { name: "HubSpot", pattern: /hubspot/i },
  { name: "Sendinblue", pattern: /sendinblue|brevo/i },
  { name: "MailerLite", pattern: /mailerlite/i },
  { name: "Privy", pattern: /privy\.com/i },
  { name: "Justuno", pattern: /justuno/i },
  { name: "OptinMonster", pattern: /optinmonster/i },
  { name: "Sumo", pattern: /sumo\.com/i },
  { name: "Poptin", pattern: /poptin/i },
];

/** Perform an HTTP(S) GET, following redirects, with a per-request timeout. */
function fetch(urlStr, { redirects = 0, method = "GET" } = {}) {
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) {
      return reject(new Error("Too many redirects"));
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      return reject(new Error(`Invalid URL: ${urlStr}`));
    }

    const lib = parsedUrl.protocol === "https:" ? https : http;

    const req = lib.request(
      parsedUrl,
      {
        method,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; BrandAuditBot/1.0; +https://github.com/brand-audit-tool)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const next = new URL(res.headers.location, parsedUrl).href;
          res.resume(); // drain
          return resolve(fetch(next, { redirects: redirects + 1, method }));
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
        res.on("error", reject);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.on("error", reject);
    req.end();
  });
}

/** HEAD request — returns status code only. */
async function headStatus(urlStr) {
  try {
    const res = await fetch(urlStr, { method: "HEAD" });
    return res.status;
  } catch {
    // Fall back to GET if HEAD fails (some servers reject HEAD)
    try {
      const res = await fetch(urlStr, { method: "GET" });
      return res.status;
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractMetaDescription(html) {
  const m = html.match(
    /<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([\s\S]*?)["'][^>]*>/i
  ) || html.match(
    /<meta[^>]+content\s*=\s*["']([\s\S]*?)["'][^>]+name\s*=\s*["']description["'][^>]*>/i
  );
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractOgImage(html) {
  const m = html.match(
    /<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([\s\S]*?)["'][^>]*>/i
  ) || html.match(
    /<meta[^>]+content\s*=\s*["']([\s\S]*?)["'][^>]+property\s*=\s*["']og:image["'][^>]*>/i
  );
  return m ? m[1].trim() : null;
}

function extractFavicon(html, baseUrl) {
  // Look for link rel="icon" / rel="shortcut icon"
  const m = html.match(
    /<link[^>]+rel\s*=\s*["'](?:shortcut )?icon["'][^>]+href\s*=\s*["']([^"']+)["'][^>]*>/i
  ) || html.match(
    /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["'](?:shortcut )?icon["'][^>]*>/i
  );
  if (m) {
    try {
      return new URL(m[1].trim(), baseUrl).href;
    } catch {
      return m[1].trim();
    }
  }
  // Default /favicon.ico
  try {
    return new URL("/favicon.ico", baseUrl).href;
  } catch {
    return null;
  }
}

function detectPlatform(html) {
  // Shopify
  if (/cdn\.shopify\.com/i.test(html) || /Shopify\.theme/i.test(html)) return "Shopify";
  // WordPress
  if (/wp-content|wp-includes/i.test(html)) return "WordPress";
  const gen = html.match(/<meta[^>]+name\s*=\s*["']generator["'][^>]+content\s*=\s*["']([^"']+)["']/i);
  if (gen) {
    const g = gen[1].toLowerCase();
    if (g.includes("wordpress")) return "WordPress";
    if (g.includes("squarespace")) return "Squarespace";
    if (g.includes("wix")) return "Wix";
    if (g.includes("webflow")) return "Webflow";
    if (g.includes("drupal")) return "Drupal";
    if (g.includes("joomla")) return "Joomla";
  }
  // Squarespace
  if (/squarespace\.com|static1\.squarespace/i.test(html)) return "Squarespace";
  // Wix
  if (/wix\.com|parastorage\.com|wixstatic\.com/i.test(html)) return "Wix";
  // Webflow
  if (/webflow/i.test(html) && /data-wf-/i.test(html)) return "Webflow";

  return "Custom";
}

function extractSocialLinks(html) {
  const links = new Set();
  const re = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    for (const domain of SOCIAL_DOMAINS) {
      if (href.includes(domain)) {
        links.add(href);
        break;
      }
    }
  }
  return [...links];
}

function extractScriptDomains(html, baseUrl) {
  const domains = new Set();
  const re = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1].trim(), baseUrl);
      if (u.hostname) domains.add(u.hostname);
    } catch {
      // skip malformed
    }
  }
  return [...domains];
}

function extractStructuredData(html) {
  const results = [];
  const re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      results.push(JSON.parse(m[1]));
    } catch {
      // malformed JSON-LD, skip
    }
  }
  return results;
}

function extractContact(html) {
  const result = { email: null, phone: null };

  // mailto links
  const mailto = html.match(/mailto:([^"'<>\s]+)/i);
  if (mailto) result.email = decodeEntities(mailto[1].split("?")[0]);

  // tel links
  const tel = html.match(/tel:([^"'<>\s]+)/i);
  if (tel) result.phone = decodeURIComponent(tel[1]);

  // Fallback: email pattern in text
  if (!result.email) {
    const em = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (em) result.email = em[0];
  }

  // Fallback: phone pattern in visible text (strip tags first)
  if (!result.phone) {
    const text = html.replace(/<[^>]+>/g, " ");
    const ph = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (ph) result.phone = ph[0].trim();
  }

  return result;
}

function extractCopyrightYear(html) {
  const text = html.replace(/<[^>]+>/g, " ");
  const m = text.match(/(?:©|\bcopyright\b)[^0-9]*(\d{4})/i);
  return m ? m[1] : null;
}

function detectReviewWidgets(html) {
  const found = [];
  for (const sig of REVIEW_SIGNATURES) {
    if (sig.pattern.test(html)) found.push(sig.name);
  }
  return found;
}

function detectEmailCapture(html) {
  const found = [];
  for (const sig of EMAIL_CAPTURE_SIGNATURES) {
    if (sig.pattern.test(html)) found.push(sig.name);
  }
  return found;
}

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ---------------------------------------------------------------------------
// Sitemap & robots
// ---------------------------------------------------------------------------

async function checkRobotsTxt(baseUrl) {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).href;
    const res = await fetch(robotsUrl);
    if (res.status === 200 && res.body.length < 500_000) {
      return { exists: true, content: res.body.trim() };
    }
    return { exists: false, content: null };
  } catch {
    return { exists: false, content: null };
  }
}

async function checkSitemap(baseUrl) {
  const sitemapUrl = new URL("/sitemap.xml", baseUrl).href;
  try {
    const res = await fetch(sitemapUrl);
    if (res.status === 200 && res.body.includes("<url")) {
      const urlMatches = res.body.match(/<url>/gi);
      return {
        exists: true,
        url: sitemapUrl,
        pages: urlMatches ? urlMatches.length : 0,
      };
    }
    // Try sitemap_index
    if (res.status === 200 && res.body.includes("<sitemap>")) {
      const smMatches = res.body.match(/<sitemap>/gi);
      return {
        exists: true,
        url: sitemapUrl,
        pages: smMatches ? smMatches.length : 0,
      };
    }
    return { exists: false, url: sitemapUrl, pages: 0 };
  } catch {
    return { exists: false, url: sitemapUrl, pages: 0 };
  }
}

// ---------------------------------------------------------------------------
// Blog detection
// ---------------------------------------------------------------------------

function detectBlog(html, baseUrl) {
  const result = { detected: false, post_count: 0, last_post_url: null };

  // Look for common blog indicators
  const blogPatterns = [
    /\/blog\//i,
    /\/posts?\//i,
    /\/articles?\//i,
    /class\s*=\s*["'][^"']*blog[^"']*["']/i,
    /class\s*=\s*["'][^"']*post[^"']*["']/i,
  ];

  for (const pat of blogPatterns) {
    if (pat.test(html)) {
      result.detected = true;
      break;
    }
  }

  // Count blog post links
  const postLinks = [];
  const re = /<a[^>]+href\s*=\s*["']([^"']*\/blog\/[^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    if (href !== "/blog/" && href !== "/blog") {
      try {
        postLinks.push(new URL(href, baseUrl).href);
      } catch {
        postLinks.push(href);
      }
    }
  }

  if (postLinks.length > 0) {
    result.detected = true;
    result.post_count = postLinks.length;
    result.last_post_url = postLinks[0];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Broken paths
// ---------------------------------------------------------------------------

async function checkBrokenPaths(baseUrl) {
  const broken = [];
  const results = await Promise.allSettled(
    COMMON_PATHS.map(async (path) => {
      const fullUrl = new URL(path, baseUrl).href;
      const status = await headStatus(fullUrl);
      if (status === 404) broken.push(path);
    })
  );
  return broken;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const inputUrl = process.argv[2];

  if (!inputUrl) {
    process.stderr.write("Usage: node scripts/scan-website.mjs <url>\n");
    process.exit(1);
  }

  // Ensure protocol
  let url = inputUrl;
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  const result = {
    url,
    title: null,
    meta_description: null,
    platform: null,
    social_links: [],
    scripts: [],
    structured_data: [],
    contact: { email: null, phone: null },
    copyright_year: null,
    ssl: /^https:/i.test(url),
    sitemap: { exists: false, url: null, pages: 0 },
    robots_txt: { exists: false, content: null },
    blog: { detected: false, post_count: 0, last_post_url: null },
    review_widgets: [],
    email_capture: [],
    broken_paths: [],
    og_image: null,
    favicon: null,
    page_size_bytes: 0,
  };

  let html = "";

  try {
    // Fetch homepage
    const res = await fetch(url);
    html = res.body;
    result.page_size_bytes = Buffer.byteLength(html, "utf-8");

    // Extract data from HTML
    result.title = extractTitle(html);
    result.meta_description = extractMetaDescription(html);
    result.platform = detectPlatform(html);
    result.social_links = extractSocialLinks(html);
    result.scripts = extractScriptDomains(html, url);
    result.structured_data = extractStructuredData(html);
    result.contact = extractContact(html);
    result.copyright_year = extractCopyrightYear(html);
    result.og_image = extractOgImage(html);
    result.favicon = extractFavicon(html, url);
    result.review_widgets = detectReviewWidgets(html);
    result.email_capture = detectEmailCapture(html);
    result.blog = detectBlog(html, url);
  } catch (err) {
    process.stderr.write(`Error fetching homepage: ${err.message}\n`);
  }

  // Parallel checks: sitemap, robots, broken paths
  try {
    const [sitemap, robots, broken] = await Promise.all([
      checkSitemap(url).catch((e) => {
        process.stderr.write(`Sitemap check error: ${e.message}\n`);
        return { exists: false, url: null, pages: 0 };
      }),
      checkRobotsTxt(url).catch((e) => {
        process.stderr.write(`Robots.txt check error: ${e.message}\n`);
        return { exists: false, content: null };
      }),
      checkBrokenPaths(url).catch((e) => {
        process.stderr.write(`Broken paths check error: ${e.message}\n`);
        return [];
      }),
    ]);

    result.sitemap = sitemap;
    result.robots_txt = robots;
    result.broken_paths = broken;
  } catch (err) {
    process.stderr.write(`Error in parallel checks: ${err.message}\n`);
  }

  // Output JSON to stdout
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
