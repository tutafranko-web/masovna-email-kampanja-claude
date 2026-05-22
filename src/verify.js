const fs = require('fs');
const path = require('path');
const dns = require('dns');

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'industries.json'), 'utf8'));
const INDUSTRIES = config.industries;
const G = config.global;

const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
const ONLY_INDUSTRY = process.env.INDUSTRY || null;
const RECHECK_ALL = process.env.RECHECK_ALL === 'true' || process.env.RECHECK_ALL === '1';
const THROTTLE_MS = Number(G.verify_throttle_ms || 50);

const sheets = require('./sheets');

const resolver = new dns.promises.Resolver({ timeout: 5000, tries: 2 });
resolver.setServers(['1.1.1.1', '8.8.8.8']);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mxCache = new Map();

function log(...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...args);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkMx(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  await sleep(THROTTLE_MS);
  try {
    const records = await resolver.resolveMx(domain);
    if (!records || records.length === 0) {
      const r = { ok: false, reason: 'no-mx' };
      mxCache.set(domain, r);
      return r;
    }
    if (records.length === 1 && records[0].exchange === '' && records[0].priority === 0) {
      const r = { ok: false, reason: 'null-mx' };
      mxCache.set(domain, r);
      return r;
    }
    const r = { ok: true, mx: records.map(x => x.exchange) };
    mxCache.set(domain, r);
    return r;
  } catch (e) {
    let reason;
    let blocking = false;
    if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') {
      reason = e.code.toLowerCase();
      blocking = true;
    } else if (e.code === 'ETIMEOUT' || e.code === 'ETIMEDOUT') {
      reason = 'timeout';
      blocking = false;
    } else {
      reason = (e.code || 'unknown').toLowerCase();
      blocking = false;
    }
    const r = { ok: false, reason, blocking };
    mxCache.set(domain, r);
    return r;
  }
}

function pickAddress(row) {
  const all = String(row.all_emails || '').split(',').map(s => s.trim()).filter(Boolean);
  if (all.length > 0) return all[0];
  const found = String(row.email_found || '').trim();
  if (found && found.toLowerCase() !== 'no' && found.includes('@')) return found;
  return null;
}

async function classify(row) {
  const addr = pickAddress(row);
  if (!addr) return { result: '', reason: 'no-address' };
  if (!EMAIL_RE.test(addr)) return { result: 'no', reason: 'syntax', address: addr };
  const domain = addr.split('@')[1].toLowerCase();
  const mx = await checkMx(domain);
  if (mx.ok) return { result: 'yes', reason: 'mx-ok', address: addr, domain };
  if (mx.reason === 'no-mx' || mx.reason === 'null-mx' || mx.reason === 'enotfound') {
    return { result: 'no', reason: mx.reason, address: addr, domain };
  }
  if (mx.reason === 'enodata') {
    return { result: 'no', reason: 'no-mx-record', address: addr, domain };
  }
  return { result: 'risky', reason: mx.reason, address: addr, domain };
}

async function verifyIndustry(industry) {
  const t0 = Date.now();
  log(`[${industry.key}] reading sheet...`);
  let rows;
  try {
    rows = await sheets.readRows(industry.sheet_id, industry.gid);
  } catch (e) {
    log(`[${industry.key}] ERROR reading sheet: ${e.message}`);
    return { industry: industry.key, error: e.message };
  }
  log(`[${industry.key}] ${rows.length} rows. Classifying...`);

  const updates = new Map();
  const counts = { yes: 0, no: 0, risky: 0, skipped: 0, kept: 0 };
  const decisions = [];

  for (const row of rows) {
    const existing = String(row.email_verified || '').trim().toLowerCase();
    if (!RECHECK_ALL && (existing === 'yes' || existing === 'no')) {
      counts.kept++;
      continue;
    }
    const decision = await classify(row);
    if (decision.result === '') {
      counts.skipped++;
      continue;
    }
    counts[decision.result]++;
    if (decision.result !== existing) {
      updates.set(row.__rowIndex, decision.result);
    }
    if (decisions.length < 50) {
      decisions.push({ row: row.__rowIndex, address: decision.address, domain: decision.domain, result: decision.result, reason: decision.reason });
    }
  }

  log(`[${industry.key}] classify done. yes=${counts.yes} no=${counts.no} risky=${counts.risky} kept=${counts.kept} skipped=${counts.skipped}. ${updates.size} cells to update.`);

  let written = 0;
  if (!DRY_RUN && updates.size > 0) {
    try {
      written = await sheets.bulkUpdateColumn(industry.sheet_id, industry.gid, 'email_verified', updates);
      log(`[${industry.key}] wrote ${written} cells.`);
    } catch (e) {
      log(`[${industry.key}] ERROR writing sheet: ${e.message}`);
    }
  } else if (DRY_RUN) {
    log(`[${industry.key}] DRY_RUN — skipped sheet write.`);
  }

  return {
    industry: industry.key,
    duration_ms: Date.now() - t0,
    total_rows: rows.length,
    counts,
    cells_updated: written,
    sample_decisions: decisions.slice(0, 10)
  };
}

async function main() {
  log(`Starting verify. DRY_RUN=${DRY_RUN} RECHECK_ALL=${RECHECK_ALL} ONLY=${ONLY_INDUSTRY || 'all'}`);
  const pool = ONLY_INDUSTRY ? INDUSTRIES.filter(i => i.key === ONLY_INDUSTRY) : INDUSTRIES;
  if (!pool.length) {
    console.error(`Unknown industry: ${ONLY_INDUSTRY}. Valid: ${INDUSTRIES.map(i => i.key).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const industry of pool) {
    const r = await verifyIndustry(industry);
    results.push(r);
  }

  log('=== SUMMARY ===');
  let totalYes = 0, totalNo = 0, totalRisky = 0, totalKept = 0;
  for (const r of results) {
    if (r.error) {
      log(`  ${r.industry}: ERROR ${r.error}`);
      continue;
    }
    log(`  ${r.industry}: yes=${r.counts.yes} no=${r.counts.no} risky=${r.counts.risky} kept=${r.counts.kept} updated=${r.cells_updated} (${Math.round(r.duration_ms / 1000)}s)`);
    totalYes += r.counts.yes;
    totalNo += r.counts.no;
    totalRisky += r.counts.risky;
    totalKept += r.counts.kept;
  }
  log(`TOTAL: yes=${totalYes} no=${totalNo} risky=${totalRisky} kept_existing=${totalKept}`);
  log(`Unique domains looked up: ${mxCache.size}`);

  const reportDir = path.resolve(__dirname, '..', 'state');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `verify-report-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    dry_run: DRY_RUN,
    recheck_all: RECHECK_ALL,
    only_industry: ONLY_INDUSTRY,
    totals: { yes: totalYes, no: totalNo, risky: totalRisky, kept: totalKept },
    unique_domains: mxCache.size,
    results
  }, null, 2));
  log(`Report saved: ${reportPath}`);
}

if (require.main === module) {
  main().catch(e => {
    console.error('FATAL', e);
    process.exit(1);
  });
}

module.exports = { main, verifyIndustry, classify, checkMx };
