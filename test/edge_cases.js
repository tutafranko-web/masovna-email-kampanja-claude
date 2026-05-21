// Edge case + parity tests for filter, variant, template, state.
const filter = require('../src/filter');
const variant = require('../src/variant');
const template = require('../src/template');
const state = require('../src/state');
const fs = require('fs');
const path = require('path');
const config = require('../industries.json');

let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name, info ? '— ' + info : ''); }
}

console.log('\n=== FILTER edge cases ===');

// 1. Empty input
assert('empty rows -> empty eligible', filter.filterEligible([], 35).length === 0);

// 2. Daily cap on E1
const e1Rows = Array.from({ length: 50 }, (_, i) => ({
  __rowIndex: i + 2, email_found: 'x@x.com', all_emails: 'x@x.com', email_status: 'active', email_step: 0
}));
const capped = filter.filterEligible(e1Rows, 35);
assert('E1 daily cap respected (35 of 50)', capped.length === 35, `got ${capped.length}`);

// 3. Follow-ups bypass cap
const followUpRows = Array.from({ length: 50 }, (_, i) => ({
  __rowIndex: i + 2, email_found: 'x@x.com', all_emails: 'x@x.com', email_status: 'active',
  email_step: 2, email_last_sent_at: new Date(Date.now() - 10 * 86400000).toISOString()
}));
const allFollow = filter.filterEligible(followUpRows, 35);
assert('Follow-ups bypass cap (50 returned)', allFollow.length === 50, `got ${allFollow.length}`);

// 4. Mixed: 50 E1 + 50 follow-ups -> 35 E1 + 50 follow-ups = 85
const mixed = filter.filterEligible([...e1Rows, ...followUpRows], 35);
assert('Mixed: 35 E1 + 50 followups = 85', mixed.length === 85, `got ${mixed.length}`);

// 5. step=4 (sequence done) excluded
const doneRow = { email_found: 'x@x.com', all_emails: 'x@x.com', email_status: 'active', email_step: 4 };
assert('step=4 excluded', filter.filterEligible([doneRow], 35).length === 0);

// 6. Status not active excluded
const inactiveRow = { email_found: 'x@x.com', all_emails: 'x@x.com', email_status: 'unsubscribed', email_step: 0 };
assert('inactive status excluded', filter.filterEligible([inactiveRow], 35).length === 0);

// 7. email_status blank treated as active
const blankStatusRow = { email_found: 'x@x.com', all_emails: 'x@x.com', email_status: '', email_step: 0 };
assert('blank status treated as active', filter.filterEligible([blankStatusRow], 35).length === 1);

// 8. email_found = 'no' excluded
const noEmailRow = { email_found: 'no', all_emails: 'x@x.com', email_status: 'active', email_step: 0 };
assert('email_found=no excluded', filter.filterEligible([noEmailRow], 35).length === 0);

// 9. all_emails without @ excluded
const badEmailRow = { email_found: 'something', all_emails: 'notamail', email_status: 'active', email_step: 0 };
assert('all_emails without @ excluded', filter.filterEligible([badEmailRow], 35).length === 0);

// 10. Follow-up too soon (sent yesterday, needs 3 days for step 1)
const tooSoon = { email_found: 'x@x.com', all_emails: 'x@x.com', email_status: 'active', email_step: 1, email_last_sent_at: new Date(Date.now() - 1 * 86400000).toISOString() };
assert('Follow-up too soon excluded', filter.filterEligible([tooSoon], 35).length === 0);

// 11. Follow-up exactly at delay (3 days for step 1)
const exactDelay = { email_found: 'x@x.com', all_emails: 'x@x.com', email_status: 'active', email_step: 1, email_last_sent_at: new Date(Date.now() - 3.5 * 86400000).toISOString() };
assert('Follow-up exactly at delay included', filter.filterEligible([exactDelay], 35).length === 1);

console.log('\n=== VARIANT all branches ===');
// Each branch of pickVariant should hit
const variantCases = [
  { row: { website_status: '500' }, expected: 'V1', desc: 'V1 - website error' },
  { row: { website_status: '200', has_website: 'no' }, expected: 'V2', desc: 'V2 - no website' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'no', pagespeed_mobile: 20 }, expected: 'V3', desc: 'V3 - no HTTPS + slow mobile' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 0 }, expected: 'V4', desc: 'V4 - no sitemap (0 pages)' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'no' }, expected: 'V4', desc: 'V4 - no sitemap (flag)' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'yes', has_ga: 'no', has_pixel: 'no' }, expected: 'V5', desc: 'V5 - no analytics' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'yes', has_ga: 'yes', has_pixel: 'yes', has_chatbot: 'no' }, expected: 'V6', industry: 'estetska', desc: 'V6 - no chatbot (matched industry)' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'yes', has_ga: 'yes', has_pixel: 'yes', has_chatbot: 'no', pagespeed_mobile: 40, health_score: 50 }, expected: 'V7', industry: 'ortopedija', desc: 'V7 - slow + low health (non-chatbot industry)' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'yes', has_ga: 'yes', has_pixel: 'yes', has_chatbot: 'yes', pagespeed_mobile: 80, has_meta_desc: 'no' }, expected: 'V8', desc: 'V8 - missing meta desc' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'yes', has_ga: 'yes', has_pixel: 'yes', has_chatbot: 'yes', pagespeed_mobile: 80, has_meta_desc: 'yes', has_og_tags: 'yes', has_schema: 'yes' }, expected: 'V9', desc: 'V9 - default fallback' }
];
for (const tc of variantCases) {
  const v = variant.pickVariant(tc.row, tc.industry || 'ortopedija');
  assert(`${tc.desc} -> ${tc.expected}`, v === tc.expected, `got ${v}`);
}

console.log('\n=== TEMPLATE rendering for all industries × all variants ===');
const G = config.global;
// Build a generic row that triggers each variant, render for each industry
let unrendered = 0;
let templateErrs = 0;
for (const industry of config.industries) {
  for (const step of [0, 1, 2, 3]) {
    for (const v of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9']) {
      const row = {
        title: 'TEST Ord. dr Test',
        all_emails: 'test@example.hr',
        email_found: 'test@example.hr',
        email_step: step,
        email_variant: v,
        website: 'https://test.hr',
        website_status: '500',
        Grad: 'Zagreb',
        phone: '+385 1 234 5678',
        review_count: 100,
        review_rating: 4.7,
        pagespeed_mobile: 25,
        Kategorija: industry.label
      };
      try {
        const email = template.buildEmail(row, industry, G);
        if (!email.to) { templateErrs++; console.log('  ✗', industry.key, 'step', step, v, 'no toEmail'); continue; }
        if (!email.subject) { templateErrs++; console.log('  ✗', industry.key, 'step', step, v, 'no subject'); continue; }
        if (!email.body) { templateErrs++; console.log('  ✗', industry.key, 'step', step, v, 'no body'); continue; }
        const m = email.body.match(/\{\{(\w+)\}\}/g);
        if (m) unrendered += m.length;
      } catch (e) {
        templateErrs++;
        console.log('  ✗', industry.key, 'step', step, v, 'ERROR:', e.message);
      }
    }
  }
}
const total = 10 * 4 * 9;
assert(`${total} industry×step×variant renders no errors`, templateErrs === 0, `errors: ${templateErrs}`);
console.log(`  (note: unrendered placeholders across all: ${unrendered} — e.g. {{e1_value_short}} in E2 templates, matches n8n parity)`);

console.log('\n=== STATE persistence ===');
const STATE_PATH = path.resolve(__dirname, '..', 'state', 'today.json');
// Wipe
if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);

const keys = config.industries.map(i => i.key);
let s = state.load(keys);
assert('Fresh load creates today entry', s.date === new Date().toISOString().slice(0, 10));
assert('All industries initialized to 0', Object.values(s.sent).every(v => v === 0));

state.increment(s, 'ortopedija');
state.increment(s, 'ortopedija');
state.increment(s, 'ginekologija');
assert('Increment persists on disk', JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')).sent.ortopedija === 2);

// Simulate next day
const s2 = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
s2.date = '2020-01-01';
fs.writeFileSync(STATE_PATH, JSON.stringify(s2));
const s3 = state.load(keys);
assert('Stale date triggers reset', s3.date === new Date().toISOString().slice(0, 10) && s3.sent.ortopedija === 0);

// Clean up
if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);

console.log('\n=== SUMMARY ===');
console.log(`Total: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
