#!/usr/bin/env node

/**
 * check-presence.mjs
 *
 * Checks online presence across platforms for a given business.
 * Zero external dependencies — Node.js built-ins only.
 *
 * Usage:
 *   node scripts/check-presence.mjs "Willow Leather" willow-leather willow-leather.com
 */

import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const [businessName, primaryHandle, domain] = process.argv.slice(2);

if (!businessName || !primaryHandle || !domain) {
  process.stderr.write(
    "Usage: node scripts/check-presence.mjs <business_name> <primary_handle> <domain>\n"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Handle variations
// ---------------------------------------------------------------------------

function generateHandles(handle) {
  // Normalise: lowercase, trim
  const h = handle.toLowerCase().trim();

  // Split on common separators to get word parts
  const parts = h.split(/[-._\s]+/).filter(Boolean);

  const exact = h; // e.g. "willow-leather"
  const dotted = parts.join("."); // e.g. "willow.leather"
  const joined = parts.join(""); // e.g. "willowleather"
  const underscored = parts.join("_"); // e.g. "willow_leather"

  // Deduplicate while preserving order
  return [...new Set([exact, dotted, joined, underscored])];
}

const handles = generateHandles(primaryHandle);

// ---------------------------------------------------------------------------
// HTTP helper — follows up to 5 redirects, 8s timeout, returns {status, body, finalUrl}
// ---------------------------------------------------------------------------

function fetch(urlStr, { maxRedirects = 5, timeout = 8000 } = {}) {
  return new Promise((resolve) => {
    let redirectsLeft = maxRedirects;

    function doRequest(currentUrl) {
      const parsed = new URL(currentUrl);
      const transport = parsed.protocol === "https:" ? https : http;

      const req = transport.get(
        currentUrl,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
            "Accept-Language": "en-GB,en;q=0.9",
          },
          timeout,
        },
        (res) => {
          // Follow redirects
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            res.headers.location &&
            redirectsLeft > 0
          ) {
            redirectsLeft--;
            const next = new URL(res.headers.location, currentUrl).href;
            res.resume(); // drain
            doRequest(next);
            return;
          }

          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            resolve({
              status: res.statusCode,
              body: Buffer.concat(chunks).toString("utf-8"),
              finalUrl: currentUrl,
            });
          });
          res.on("error", (err) => {
            resolve({ status: 0, body: "", finalUrl: currentUrl, error: err.message });
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        resolve({ status: 0, body: "", finalUrl: currentUrl, error: "timeout" });
      });

      req.on("error", (err) => {
        resolve({ status: 0, body: "", finalUrl: currentUrl, error: err.message });
      });
    }

    doRequest(urlStr);
  });
}

// ---------------------------------------------------------------------------
// Platform checkers
// ---------------------------------------------------------------------------

async function checkTrustpilot() {
  const url = `https://www.trustpilot.com/review/${domain}`;
  const platform = { name: "Trustpilot", url, found: null, rating: null, review_count: null, notes: "" };

  try {
    const res = await fetch(url);

    if (res.error) {
      platform.notes = res.error;
      return platform;
    }

    if (res.status === 200) {
      platform.found = true;

      // Try to extract rating from JSON-LD or meta tags
      const ratingMatch =
        res.body.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/) ||
        res.body.match(/data-rating="([\d.]+)"/) ||
        res.body.match(/TrustScore\s+([\d.]+)/);
      if (ratingMatch) {
        platform.rating = parseFloat(ratingMatch[1]);
      }

      // Try to extract review count
      const countMatch =
        res.body.match(/"reviewCount"\s*:\s*"?(\d+)"?/) ||
        res.body.match(/(\d[\d,]*)\s+reviews?/i);
      if (countMatch) {
        platform.review_count = parseInt(countMatch[1].replace(/,/g, ""), 10);
      }
    } else if (res.status === 404) {
      platform.found = false;
      platform.notes = "No Trustpilot page for this domain";
    } else {
      platform.found = false;
      platform.notes = `HTTP ${res.status}`;
    }
  } catch (err) {
    platform.notes = err.message;
  }

  return platform;
}

async function checkPlatformHandles(platformName, urlTemplate, handleSubset) {
  const trialled = handleSubset || handles;
  const results = [];

  for (const h of trialled) {
    const url = urlTemplate.replace("{handle}", h);
    try {
      const res = await fetch(url);

      if (res.error) {
        results.push({ handle: h, url, status: 0, error: res.error });
        continue;
      }

      results.push({ handle: h, url, status: res.status, finalUrl: res.finalUrl });
    } catch (err) {
      results.push({ handle: h, url, status: 0, error: err.message });
    }
  }

  // Pick best result: prefer 200 that didn't redirect away from the expected path
  const found = results.find((r) => r.status === 200);
  const platform = {
    name: platformName,
    url: found ? found.url : results[0]?.url || "",
    found: null,
    handle_matched: null,
    notes: "",
  };

  if (found) {
    platform.found = true;
    platform.handle_matched = found.handle;
  } else if (results.every((r) => r.error)) {
    platform.found = null;
    const errors = [...new Set(results.map((r) => r.error))];
    platform.notes = errors.join("; ");
  } else {
    platform.found = false;
    const statuses = [...new Set(results.map((r) => r.status))];
    platform.notes = `Tried ${trialled.length} handles, statuses: ${statuses.join(", ")}`;
  }

  return platform;
}

async function checkPinterest() {
  return checkPlatformHandles("Pinterest", "https://www.pinterest.co.uk/{handle}/", handles);
}

async function checkYouTube() {
  return checkPlatformHandles("YouTube", "https://www.youtube.com/@{handle}", handles);
}

async function checkEtsy() {
  // Etsy shops typically use joined or hyphenated names
  const exact = handles[0];
  const joined = handles.find((h) => !h.includes("-") && !h.includes(".") && !h.includes("_")) || handles[0];
  const etsyHandles = [...new Set([exact, joined])];
  return checkPlatformHandles("Etsy", "https://www.etsy.com/uk/shop/{handle}", etsyHandles);
}

async function checkFacebook() {
  return checkPlatformHandles("Facebook", "https://www.facebook.com/{handle}/", handles);
}

async function checkCompaniesHouse() {
  const encodedName = encodeURIComponent(businessName);
  const url = `https://api.company-information.service.gov.uk/search/companies?q=${encodedName}`;
  const result = { found: null, company_name: null, company_number: null, status: null, notes: "" };

  try {
    const res = await fetch(url);

    if (res.error) {
      result.notes = res.error;
      return result;
    }

    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        if (data.items && data.items.length > 0) {
          const top = data.items[0];
          result.found = true;
          result.company_name = top.title || null;
          result.company_number = top.company_number || null;
          result.status = top.company_status
            ? top.company_status.charAt(0).toUpperCase() + top.company_status.slice(1)
            : null;
        } else {
          result.found = false;
          result.notes = "No matching companies found";
        }
      } catch {
        result.notes = "Failed to parse JSON response";
      }
    } else {
      result.notes = `HTTP ${res.status}`;
    }
  } catch (err) {
    result.notes = err.message;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  process.stderr.write(`Checking online presence for "${businessName}"...\n`);
  process.stderr.write(`Domain: ${domain}\n`);
  process.stderr.write(`Handle variations: ${handles.join(", ")}\n\n`);

  const [trustpilot, pinterest, youtube, etsy, facebook, companiesHouse] = await Promise.all([
    checkTrustpilot(),
    checkPinterest(),
    checkYouTube(),
    checkEtsy(),
    checkFacebook(),
    checkCompaniesHouse(),
  ]);

  const output = {
    business_name: businessName,
    domain,
    handles_tried: handles,
    platforms: [trustpilot, pinterest, youtube, etsy, facebook],
    companies_house: companiesHouse,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
