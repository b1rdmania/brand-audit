import https from 'node:https';

const TIMEOUT_MS = 60_000;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: TIMEOUT_MS }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        fetchJson(res.headers.location).then(resolve, reject);
        return;
      }

      if (res.statusCode !== 200) {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8').substring(0, 500);
          reject(new Error(`HTTP ${res.statusCode} from PageSpeed API: ${body}`));
        });
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw.length) {
          reject(new Error('Empty response from PageSpeed API'));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(new Error(`Failed to parse API response (${raw.length} bytes): ${err.message}`));
        }
      });
      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`));
    });

    req.on('error', reject);
  });
}

function displayValue(audit) {
  return audit?.displayValue ?? null;
}

function numericValue(audit) {
  return audit?.numericValue ?? null;
}

function extractMetrics(audits) {
  const fcp = displayValue(audits['first-contentful-paint']);
  const lcp = displayValue(audits['largest-contentful-paint']);
  const tbt = displayValue(audits['total-blocking-time']);
  const cls = numericValue(audits['cumulative-layout-shift']);
  const si  = displayValue(audits['speed-index']);

  return {
    first_contentful_paint:  fcp  ?? 'n/a',
    largest_contentful_paint: lcp ?? 'n/a',
    total_blocking_time:     tbt  ?? 'n/a',
    cumulative_layout_shift: cls !== null ? String(parseFloat(cls.toFixed(2))) : 'n/a',
    speed_index:             si   ?? 'n/a',
  };
}

function extractOpportunities(audits) {
  const opportunities = [];

  for (const audit of Object.values(audits)) {
    if (
      audit.details?.type === 'opportunity' &&
      typeof audit.details?.overallSavingsMs === 'number' &&
      audit.details.overallSavingsMs > 0
    ) {
      opportunities.push({
        title:       audit.title,
        savings_ms:  Math.round(audit.details.overallSavingsMs),
      });
    }
  }

  return opportunities
    .sort((a, b) => b.savings_ms - a.savings_ms)
    .slice(0, 3);
}

async function main() {
  const targetUrl = process.argv[2];

  if (!targetUrl) {
    process.stderr.write('Usage: node scripts/check-pagespeed.mjs <url>\n');
    process.exit(1);
  }

  // Basic URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    process.stderr.write(`Error: Invalid URL "${targetUrl}"\n`);
    process.exit(1);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    process.stderr.write(`Error: URL must use http or https protocol\n`);
    process.exit(1);
  }

  const apiUrl =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(targetUrl)}` +
    `&strategy=mobile` +
    `&category=performance`;

  let data;
  try {
    process.stderr.write(`Fetching PageSpeed data for ${targetUrl} ...\n`);
    data = await fetchJson(apiUrl);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }

  const categories   = data?.lighthouseResult?.categories;
  const audits       = data?.lighthouseResult?.audits;

  if (!categories || !audits) {
    process.stderr.write('Error: Unexpected API response structure\n');
    process.stderr.write(JSON.stringify(data, null, 2) + '\n');
    process.exit(1);
  }

  const rawScore = categories?.performance?.score;
  const score    = rawScore !== null && rawScore !== undefined
    ? Math.round(rawScore * 100)
    : null;

  const result = {
    url:          targetUrl,
    score,
    metrics:      extractMetrics(audits),
    opportunities: extractOpportunities(audits),
  };

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();
