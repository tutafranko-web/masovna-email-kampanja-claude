// One-off dedup executor.
// Reads all sheets, identifies duplicate emails (within-sheet and cross-industry),
// optionally verifies via BulkEmailChecker, then marks losers email_status=duplicate
// (or marks ALL instances email_status=failed if verify fails).
//
// Usage: node src/dedup_executor.js [--dry-run] [--skip-verify]
//   --dry-run     don't write to sheets, just print plan
//   --skip-verify skip BulkEmailChecker (use existing email_verified_api values only)

const sheets = require('./sheets');
const emailcheck = require('./emailcheck');
const config = require('../industries.json');

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_VERIFY = process.argv.includes('--skip-verify');

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

function extractEmails(s) {
  return String(s || '')
    .split(/[,;\s]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@') && e.includes('.'));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  log(`Starting dedup executor. DRY_RUN=${DRY_RUN} SKIP_VERIFY=${SKIP_VERIFY}`);

  // Step 1 — read all sheets
  const globalMap = new Map();   // email -> [{industry, sheet_id, gid, rowIdx, row, step, lastSent, status, verifyApi}]
  const perIndustryRows = {};
  for (const ind of config.industries) {
    log(`Reading ${ind.key}...`);
    const rows = await sheets.readRows(ind.sheet_id, ind.gid);
    perIndustryRows[ind.key] = rows;
    for (const r of rows) {
      const emails = extractEmails(r.all_emails);
      if (!emails.length) continue;
      const primary = emails[0];
      if (!globalMap.has(primary)) globalMap.set(primary, []);
      globalMap.get(primary).push({
        industry: ind.key,
        sheet_id: ind.sheet_id,
        gid: ind.gid,
        rowIdx: r.__rowIndex,
        row: r,
        step: Number(r.email_step || 0),
        lastSent: r.email_last_sent_at || '',
        status: String(r.email_status || '').trim().toLowerCase(),
        verifyApi: String(r.email_verified_api || '').trim().toLowerCase()
      });
    }
  }

  // Step 2 — find emails with duplicates
  const dupEmails = [...globalMap.entries()].filter(([_, occs]) => occs.length > 1);
  log(`Found ${dupEmails.length} emails with 2+ occurrences (out of ${globalMap.size} unique).`);

  // Step 3 — for each duplicate email, classify
  const decisions = []; // {email, action, occs[], reason}
  let needVerify = [];

  for (const [email, occs] of dupEmails) {
    const anyPassed = occs.some(o => o.verifyApi === 'passed');
    const anyFailed = occs.some(o => o.verifyApi === 'failed');
    const allEmpty = occs.every(o => !o.verifyApi);

    if (anyPassed) {
      // Verified valid — pick winner, mark losers duplicate
      decisions.push({ email, occs, action: 'dedup', reason: 'verified-passed' });
    } else if (anyFailed && !anyPassed) {
      // All instances verified failed — mark all failed
      decisions.push({ email, occs, action: 'fail-all', reason: 'verified-failed' });
    } else if (allEmpty && !SKIP_VERIFY) {
      // Needs verification
      needVerify.push(email);
      decisions.push({ email, occs, action: 'pending-verify', reason: 'needs-verify' });
    } else {
      // SKIP_VERIFY and no result — assume valid, dedup
      decisions.push({ email, occs, action: 'dedup', reason: 'unknown-assume-valid' });
    }
  }

  log(`Decisions: ${decisions.length}`);
  log(`  - dedup (verified passed): ${decisions.filter(d => d.action === 'dedup' && d.reason === 'verified-passed').length}`);
  log(`  - fail-all (verified failed): ${decisions.filter(d => d.action === 'fail-all').length}`);
  log(`  - pending-verify: ${needVerify.length}`);
  log(`  - dedup (unknown, skip-verify): ${decisions.filter(d => d.action === 'dedup' && d.reason === 'unknown-assume-valid').length}`);

  // Step 4 — verify pending emails via BulkEmailChecker
  if (needVerify.length > 0 && !SKIP_VERIFY) {
    log(`Verifying ${needVerify.length} emails via BulkEmailChecker...`);
    let verified = 0;
    let lastCredits = null;
    for (const email of needVerify) {
      try {
        const result = await emailcheck.verify(email);
        if (result.creditsRemaining !== undefined) lastCredits = result.creditsRemaining;
        const dec = decisions.find(d => d.email === email);
        if (result.status === 'passed') {
          dec.action = 'dedup';
          dec.reason = 'fresh-verify-passed';
          dec.verifyEvent = result.event;
        } else if (result.status === 'failed') {
          dec.action = 'fail-all';
          dec.reason = 'fresh-verify-failed';
          dec.verifyEvent = result.event;
        } else {
          // unknown — assume valid, proceed dedup but log
          dec.action = 'dedup';
          dec.reason = 'verify-unknown-' + result.event;
          dec.verifyEvent = result.event;
        }
        verified++;
        if (verified % 20 === 0) log(`  Verified ${verified}/${needVerify.length} (credits left: ${lastCredits ?? '?'})`);
        // Light rate limiting
        await sleep(800);
      } catch (e) {
        log(`  ERROR verifying ${email}: ${e.message}`);
        const dec = decisions.find(d => d.email === email);
        dec.action = 'dedup';
        dec.reason = 'verify-error-assume-valid';
      }
    }
    log(`Verification done. Credits remaining: ${lastCredits ?? '?'}`);
  }

  // Step 5 — compute writes per industry
  // For each decision:
  //   action=dedup: sort occs by (step desc, lastSent desc, industry asc) — keep first, mark rest duplicate
  //   action=fail-all: mark ALL occs with email_status=failed AND email_verified_api=failed
  const writesByIndustry = {}; // ind -> Map(rowIdx -> {status, verifyApi})
  for (const ind of config.industries) writesByIndustry[ind.key] = new Map();

  let dedupedCount = 0, failedAllCount = 0;

  for (const dec of decisions) {
    if (dec.action === 'dedup') {
      const sorted = [...dec.occs].sort((a, b) => {
        if (b.step !== a.step) return b.step - a.step;
        if (b.lastSent !== a.lastSent) return b.lastSent.localeCompare(a.lastSent);
        return a.industry.localeCompare(b.industry);
      });
      // skip first (winner), mark rest
      for (let i = 1; i < sorted.length; i++) {
        const o = sorted[i];
        if (o.status === 'duplicate') continue;  // already marked
        writesByIndustry[o.industry].set(o.rowIdx, { email_status: 'duplicate' });
        dedupedCount++;
      }
    } else if (dec.action === 'fail-all') {
      for (const o of dec.occs) {
        const existing = writesByIndustry[o.industry].get(o.rowIdx) || {};
        existing.email_status = 'failed';
        existing.email_verified_api = 'failed';
        if (dec.verifyEvent) existing.email_verified_api_event = dec.verifyEvent;
        writesByIndustry[o.industry].set(o.rowIdx, existing);
        failedAllCount++;
      }
    }
  }

  log(`Writes planned: ${dedupedCount} duplicates + ${failedAllCount} failed-instances`);
  for (const [ind, writes] of Object.entries(writesByIndustry)) {
    if (writes.size > 0) log(`  ${ind}: ${writes.size} rows`);
  }

  if (DRY_RUN) {
    log('DRY_RUN — no writes performed.');
    return;
  }

  // Step 6 — execute batch writes per industry
  for (const ind of config.industries) {
    const writes = writesByIndustry[ind.key];
    if (writes.size === 0) continue;
    log(`Writing ${ind.key}: ${writes.size} rows...`);

    // Group writes by column
    const statusWrites = new Map();
    const verifyApiWrites = new Map();
    const verifyEventWrites = new Map();
    for (const [rowIdx, upd] of writes.entries()) {
      if (upd.email_status) statusWrites.set(rowIdx, upd.email_status);
      if (upd.email_verified_api) verifyApiWrites.set(rowIdx, upd.email_verified_api);
      if (upd.email_verified_api_event) verifyEventWrites.set(rowIdx, upd.email_verified_api_event);
    }

    try {
      if (statusWrites.size > 0) {
        const n = await sheets.bulkUpdateColumn(ind.sheet_id, ind.gid, 'email_status', statusWrites);
        log(`  email_status: ${n} cells updated`);
      }
      if (verifyApiWrites.size > 0) {
        const n = await sheets.bulkUpdateColumn(ind.sheet_id, ind.gid, 'email_verified_api', verifyApiWrites);
        log(`  email_verified_api: ${n} cells updated`);
      }
      if (verifyEventWrites.size > 0) {
        const n = await sheets.bulkUpdateColumn(ind.sheet_id, ind.gid, 'email_verified_api_event', verifyEventWrites);
        log(`  email_verified_api_event: ${n} cells updated`);
      }
    } catch (e) {
      log(`  ERROR writing ${ind.key}: ${e.message}`);
    }
  }

  log('DONE.');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
