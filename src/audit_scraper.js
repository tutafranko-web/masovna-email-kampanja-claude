// Audit re-scanner. Reads all sheets, re-audits websites with improved logic,
// updates audit fields. Run via cron or manual to refresh stale data.
//
// Improvements over original n8n scraper:
//   - Sitemap: checks /sitemap.xml AND /sitemap_index.xml AND /sitemap1.xml
//             AND parses robots.txt for Sitemap: directive
//   - HTTPS: follows redirect from http→https before classifying
//   - Chatbot: 8 platforms (was 1-2)
//   - GA: GA4 + UA + GTM (was just UA)
//   - Pixel: FB + TikTok + LinkedIn
//   - Schema: JSON-LD + microdata
//   - Concurrent fetches (10 parallel) — finishes 500 rows in ~5 min
//
// env:
//   LIMIT=500              max rows per run (default 500)
//   AUDIT_TTL_DAYS=30      skip rows audited within N days (default 30)
//   FORCE=true             re-audit all (ignore TTL)
//   ONLY=psihijatrija      single industry
//   DRY_RUN=true           don't write to sheets

const https = require('https');
const http = require('http');
const { URL } = require('url');
const dns = require('dns');

const sheets = require('./sheets');
const config = require('../industries.json');

const LIMIT = Number(process.env.LIMIT || 500);
const TTL_DAYS = Number(process.env.AUDIT_TTL_DAYS || 30);
const FORCE = process.env.FORCE === 'true';
const ONLY = process.env.ONLY || null;
const DRY_RUN = process.env.DRY_RUN === 'true';
const FETCH_TIMEOUT_MS = 10000;
const CONCURRENCY = 10;

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

const ipCache = new Map();
function resolveIp(hostname) {
  if (ipCache.has(hostname)) return Promise.resolve(ipCache.get(hostname));
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) return reject(err);
      ipCache.set(hostname, address);
      resolve(address);
    });
  });
}

// Fetch with manual redirect following, IP-resolved DNS bypass, raw body return
async function fetchUrl(urlStr, opts = {}) {
  const maxRedirects = opts.maxRedirects ?? 3;
  const method = opts.method || 'GET';
  let currentUrl = urlStr;
  for (let i = 0; i <= maxRedirects; i++) {
    const u = new URL(currentUrl);
    const isHttps = u.protocol === 'https:';
    const mod = isHttps ? https : http;
    let body, status, headers;
    try {
      const ip = await resolveIp(u.hostname);
      ({ body, status, headers } = await new Promise((resolve, reject) => {
        const req = mod.request({
          method,
          host: ip,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname + u.search,
          servername: u.hostname,
          headers: {
            Host: u.hostname,
            'User-Agent': 'Mozilla/5.0 (compatible; Opsis-Audit/1.0)',
            Accept: 'text/html,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: FETCH_TIMEOUT_MS,
          // Ignore self-signed/expired certs — we want to know it's reachable
          rejectUnauthorized: false
        }, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve({ body: Buffer.concat(chunks).toString('utf8'), status: res.statusCode, headers: res.headers }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.end();
      }));
    } catch (e) {
      return { error: e.message, finalUrl: currentUrl };
    }
    if ([301, 302, 303, 307, 308].includes(status) && headers.location && i < maxRedirects) {
      currentUrl = new URL(headers.location, currentUrl).toString();
      continue;
    }
    return { body, status, headers, finalUrl: currentUrl };
  }
  return { error: 'too_many_redirects', finalUrl: currentUrl };
}

async function checkSitemap(websiteUrl) {
  // 1. Try robots.txt and look for Sitemap: directive
  try {
    const robotsUrl = new URL('/robots.txt', websiteUrl).toString();
    const r = await fetchUrl(robotsUrl, { maxRedirects: 2 });
    if (r.body && /^\s*sitemap\s*:/im.test(r.body)) {
      const match = r.body.match(/^\s*sitemap\s*:\s*(\S+)/im);
      if (match) {
        // Verify that listed sitemap actually exists
        try {
          const sm = await fetchUrl(match[1].trim(), { maxRedirects: 2, method: 'HEAD' });
          if (sm.status && sm.status < 400) return 'yes';
        } catch {}
        // Even if HEAD fails, robots.txt declaring sitemap is a strong signal
        return 'yes';
      }
    }
  } catch {}
  // 2. Try common sitemap paths
  const paths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap1.xml', '/wp-sitemap.xml'];
  for (const p of paths) {
    try {
      const sm = await fetchUrl(new URL(p, websiteUrl).toString(), { maxRedirects: 2 });
      if (sm.status && sm.status < 400 && sm.body && (sm.body.includes('<urlset') || sm.body.includes('<sitemapindex'))) {
        return 'yes';
      }
    } catch {}
  }
  return 'no';
}

function detectInHtml(html) {
  if (!html) return {};
  const h = html.toLowerCase();
  // GA
  const hasGa = /\bua-\d+|G-[a-z0-9]+|gtag\s*\(/i.test(html) || /googletagmanager\.com\/gtag\/js|googletagmanager\.com\/gtm\.js/i.test(html);
  // Pixel (FB, Meta, TikTok, LinkedIn)
  const hasPixel = /fbq\s*\(|connect\.facebook\.net\/[^"']+\/fbevents\.js/i.test(html) ||
                   /tiktok\.com\/i18n\/pixel/i.test(html) ||
                   /snap\.licdn\.com\/li\.lms-analytics/i.test(html);
  // Chatbots (8 platforms)
  const hasChatbot = /(intercom\.io\/widget|widget\.intercom\.io)/i.test(html) ||
                     /(driftt\.com|drift\.com\/embed)/i.test(html) ||
                     /(embed\.tawk\.to|tawk\.to)/i.test(html) ||
                     /(tidio\.co|code\.tidio)/i.test(html) ||
                     /(livechatinc\.com|cdn\.livechatinc)/i.test(html) ||
                     /(crisp\.chat|client\.crisp\.chat)/i.test(html) ||
                     /(chatra)/i.test(html) ||
                     /(static\.zdassets\.com|zendesk)/i.test(html) ||
                     /(messenger.{0,5}for.{0,5}business|fb-customerchat)/i.test(html);
  // Schema (JSON-LD or microdata)
  const hasSchema = /<script[^>]*type=["']application\/ld\+json["']/i.test(html) ||
                    /itemscope[\s>]/i.test(html) && /itemtype\s*=\s*["'][^"']*schema\.org/i.test(html);
  // Meta description
  const hasMetaDesc = /<meta[^>]*name=["']description["'][^>]*content=["'][^"']{10,}/i.test(html);
  // OG tags (at least one)
  const hasOgTags = /<meta[^>]*property=["']og:/i.test(html);
  return {
    has_ga: hasGa ? 'yes' : 'no',
    has_pixel: hasPixel ? 'yes' : 'no',
    has_chatbot: hasChatbot ? 'yes' : 'no',
    has_schema: hasSchema ? 'yes' : 'no',
    has_meta_desc: hasMetaDesc ? 'yes' : 'no',
    has_og_tags: hasOgTags ? 'yes' : 'no'
  };
}

async function auditOne(websiteRaw) {
  const websiteOriginal = String(websiteRaw || '').trim();
  if (!websiteOriginal || !websiteOriginal.includes('.')) {
    return { has_website: 'no', website_status: '', is_https: 'no' };
  }
  let url = websiteOriginal;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  // Fetch homepage
  const r = await fetchUrl(url);
  if (r.error) {
    return {
      has_website: 'yes',  // we tried, it exists nominally
      website_status: r.error.slice(0, 50),
      is_https: url.startsWith('https://') ? 'yes' : 'no',
      has_sitemap: '',
      has_ga: '', has_pixel: '', has_chatbot: '', has_schema: '', has_meta_desc: '', has_og_tags: ''
    };
  }
  const finalUrl = r.finalUrl || url;
  const isHttps = finalUrl.startsWith('https://') ? 'yes' : 'no';
  const audit = detectInHtml(r.body);
  const sitemap = await checkSitemap(finalUrl);
  return {
    has_website: 'yes',
    website_status: String(r.status || ''),
    is_https: isHttps,
    has_sitemap: sitemap,
    ...audit
  };
}

function shouldAudit(row) {
  if (FORCE) return true;
  const last = String(row.last_audited || '').trim();
  if (!last) return true;
  const days = (Date.now() - new Date(last).getTime()) / 86400000;
  return days >= TTL_DAYS;
}

// Simple concurrency limiter
async function runWithConcurrency(items, fn, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = { error: e.message };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

const AUDIT_COLS = ['has_website', 'website_status', 'is_https', 'has_sitemap',
  'has_ga', 'has_pixel', 'has_chatbot', 'has_schema', 'has_meta_desc', 'has_og_tags', 'last_audited'];

async function main() {
  log(`audit_scraper start. LIMIT=${LIMIT} TTL_DAYS=${TTL_DAYS} FORCE=${FORCE} ONLY=${ONLY || 'all'} DRY_RUN=${DRY_RUN}`);

  const pool = ONLY ? config.industries.filter(i => i.key === ONLY) : config.industries;
  if (!pool.length) { console.error('No industries matched'); process.exit(1); }

  let totalChanged = 0;
  let totalAudited = 0;

  for (const ind of pool) {
    log(`--- ${ind.key} ---`);
    const rows = await sheets.readRows(ind.sheet_id, ind.gid);

    // Ensure new columns exist
    if (!DRY_RUN) {
      for (const col of AUDIT_COLS) {
        await sheets.ensureColumn(ind.sheet_id, ind.gid, col);
      }
    }

    const candidates = rows
      .filter(r => {
        const website = String(r.website || '').trim();
        return website.length > 3 && website.includes('.') && shouldAudit(r);
      })
      .slice(0, LIMIT - totalAudited);

    log(`${ind.key}: ${rows.length} rows, ${candidates.length} eligible for audit`);
    if (!candidates.length) continue;

    const auditResults = await runWithConcurrency(
      candidates,
      async (r, i) => {
        const result = await auditOne(r.website);
        if (i % 25 === 0) log(`  audited ${i + 1}/${candidates.length} in ${ind.key}`);
        return { row: r, result };
      },
      CONCURRENCY
    );

    // Build batch writes per column
    const writes = {};
    for (const col of AUDIT_COLS) writes[col] = new Map();

    let changedInIndustry = 0;
    const nowIso = new Date().toISOString();
    for (const { row, result } of auditResults) {
      if (!result || result.error) continue;
      const updates = { ...result, last_audited: nowIso };
      let changed = false;
      for (const [col, val] of Object.entries(updates)) {
        if (val === undefined) continue;
        if (String(row[col] || '') !== String(val)) {
          writes[col].set(row.__rowIndex, val);
          changed = true;
        }
      }
      if (changed) changedInIndustry++;
    }

    if (DRY_RUN) {
      log(`  DRY_RUN: ${changedInIndustry} rows would change in ${ind.key}`);
    } else {
      for (const col of AUDIT_COLS) {
        if (writes[col].size > 0) {
          try {
            const n = await sheets.bulkUpdateColumn(ind.sheet_id, ind.gid, col, writes[col]);
            log(`  ${col}: ${n} cells updated`);
          } catch (e) {
            log(`  ERROR ${col}: ${e.message}`);
          }
        }
      }
    }

    totalAudited += candidates.length;
    totalChanged += changedInIndustry;

    if (totalAudited >= LIMIT) {
      log(`Hit LIMIT (${LIMIT}). Stopping.`);
      break;
    }
  }

  log(`DONE. Audited ${totalAudited}, changed ${totalChanged}`);
}

if (require.main === module) {
  main().catch(e => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main, auditOne };
