const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'industries.json'), 'utf8'));
const INDUSTRIES = config.industries;
const G = config.global;

const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
const ONLY_INDUSTRY = process.env.INDUSTRY || null;
const LIMIT_OVERRIDE = process.env.LIMIT ? Number(process.env.LIMIT) : null;
const SKIP_CYCLE_WAIT = process.env.SKIP_CYCLE_WAIT === 'true';

const filter = require('./filter');
const variant = require('./variant');
const template = require('./template');
const sheets = require('./sheets');
const smtp = require('./smtp');
const state = require('./state');
const emailcheck = require('./emailcheck');

const SKIP_API_CHECK = process.env.SKIP_API_CHECK === 'true' || process.env.SKIP_API_CHECK === '1';

function log(...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...args);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function processIndustry(industry, st) {
  const dailyLimit = LIMIT_OVERRIDE !== null ? LIMIT_OVERRIDE : G.daily_limit_per_industry;
  if (st.sent[industry.key] >= dailyLimit) {
    log(`[${industry.key}] skip — already sent ${st.sent[industry.key]}/${dailyLimit} today`);
    return 'capped';
  }

  let rows;
  try {
    rows = await sheets.readRows(industry.sheet_id, industry.gid);
  } catch (e) {
    log(`[${industry.key}] ERROR reading sheet: ${e.message}`);
    return 'error';
  }

  const eligible = filter.filterEligible(rows, dailyLimit);
  if (!eligible.length) {
    log(`[${industry.key}] no eligible rows`);
    return 'no-eligible';
  }

  const row = eligible[0];
  row.email_variant = variant.pickVariant(row, industry.key);
  const email = template.buildEmail(row, industry, G);

  if (!email.to || !email.to.includes('@')) {
    log(`[${industry.key}] row ${row.__rowIndex} has no usable email, skipping`);
    return 'no-email';
  }

  log(`[${industry.key}] -> ${email.to} | step ${row.email_step || 0}->${email.nextStep} | variant ${row.email_variant} | "${email.subject}"`);

  // JIT API verification (skip if already API-checked or explicitly disabled)
  const existingApi = String(row.email_verified_api || '').trim().toLowerCase();
  let apiResult = null;
  if (!SKIP_API_CHECK && !['passed', 'unknown'].includes(existingApi)) {
    try {
      apiResult = await emailcheck.verify(email.to);
      log(`[${industry.key}] API check: ${apiResult.status}/${apiResult.event} (creditsRemaining=${apiResult.creditsRemaining ?? '?'})`);
      if (apiResult.status === 'failed') {
        if (!DRY_RUN) {
          try {
            await sheets.updateRow(row.__row, {
              email_verified_api: 'failed',
              email_verified_api_event: apiResult.event || ''
            });
          } catch (e) { log(`[${industry.key}] WARN sheet update (failed mark) failed: ${e.message}`); }
        }
        return 'api-failed';
      }
    } catch (e) {
      log(`[${industry.key}] API check error (proceeding to send anyway): ${e.message}`);
    }
  }

  if (DRY_RUN) {
    log(`[${industry.key}] DRY_RUN — not sending, not updating sheet`);
    return 'dry';
  }

  try {
    await smtp.sendMail(industry, G, email);
  } catch (e) {
    log(`[${industry.key}] SMTP ERROR: ${e.message}`);
    return 'smtp-error';
  }

  try {
    const nowIso = new Date().toISOString();
    const updates = {
      email_step: email.nextStep,
      email_last_sent_at: nowIso,
      email_last_variant: row.email_variant,
      email_last_subject: email.subject
    };
    if (apiResult) {
      updates.email_verified_api = apiResult.status;
      updates.email_verified_api_event = apiResult.event || '';
    }
    await sheets.updateRow(row.__row, updates);
  } catch (e) {
    log(`[${industry.key}] WARN sheet update failed (email already sent!): ${e.message}`);
  }

  state.increment(st, industry.key);
  log(`[${industry.key}] sent ${st.sent[industry.key]}/${dailyLimit}`);
  return 'sent';
}

async function main() {
  log(`Starting masovna-email-kampanja-claude. DRY_RUN=${DRY_RUN} ONLY=${ONLY_INDUSTRY || 'all'} LIMIT_OVERRIDE=${LIMIT_OVERRIDE ?? 'default'}`);
  const startTime = Date.now();

  let pool = INDUSTRIES;
  if (ONLY_INDUSTRY) {
    pool = INDUSTRIES.filter(i => i.key === ONLY_INDUSTRY);
    if (!pool.length) {
      console.error(`Unknown industry: ${ONLY_INDUSTRY}. Valid: ${INDUSTRIES.map(i => i.key).join(', ')}`);
      process.exit(1);
    }
  }

  const st = state.load(pool.map(i => i.key));
  log(`State today=${st.date} sent=${JSON.stringify(st.sent)}`);

  let cycle = 0;
  const dailyLimit = LIMIT_OVERRIDE !== null ? LIMIT_OVERRIDE : G.daily_limit_per_industry;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > G.session_max_runtime_ms) {
      log(`Session time budget exhausted (${Math.round(elapsed / 1000)}s). Exiting.`);
      break;
    }

    const remaining = pool.filter(i => st.sent[i.key] < dailyLimit);
    if (!remaining.length) {
      log(`All industries hit daily cap (${dailyLimit}). Done for today.`);
      break;
    }

    cycle++;
    log(`--- Cycle ${cycle} | remaining industries: ${remaining.length} ---`);

    const order = shuffle(remaining);
    let progressMade = false;
    for (const industry of order) {
      const elapsed2 = Date.now() - startTime;
      if (elapsed2 > G.session_max_runtime_ms) break;

      const result = await processIndustry(industry, st);

      if (result === 'sent' || result === 'dry') {
        progressMade = true;
        const wait = randInt(G.min_wait_between_sends_ms, G.max_wait_between_sends_ms);
        log(`Sleeping ${Math.round(wait / 1000)}s before next send...`);
        await sleep(wait);
      }
    }

    if (!progressMade) {
      log(`No industry made progress this cycle (all errored or no eligible rows). Exiting to avoid spin.`);
      break;
    }

    if (SKIP_CYCLE_WAIT || ONLY_INDUSTRY) {
      log('Skipping cycle wait (single industry / explicit skip).');
      if (pool.every(i => st.sent[i.key] >= dailyLimit)) break;
      continue;
    }

    const cycleWait = randInt(G.min_cycle_wait_ms, G.max_cycle_wait_ms);
    log(`Cycle ${cycle} complete. Sleeping ${Math.round(cycleWait / 60000)}min before next cycle...`);
    await sleep(cycleWait);
  }

  const totalSent = Object.values(st.sent).reduce((a, b) => a + b, 0);
  log(`DONE. Total sent today across industries: ${totalSent}. Per-industry: ${JSON.stringify(st.sent)}`);
}

if (require.main === module) {
  main().catch(e => {
    console.error('FATAL', e);
    process.exit(1);
  });
}

module.exports = { main, processIndustry };
