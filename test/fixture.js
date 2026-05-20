// Offline unit-test: exercises filter + variant + template against mock rows.
// Does NOT call Sheets API or SMTP. Verifies that the porting from n8n is correct.

const filter = require('../src/filter');
const variant = require('../src/variant');
const template = require('../src/template');
const config = require('../industries.json');

const G = config.global;
const ORTOPEDIJA = config.industries.find(i => i.key === 'ortopedija');

const mockRows = [
  {
    __rowIndex: 2,
    title: 'Ordinacija dr Marko',
    email_found: 'info@example.hr',
    all_emails: 'info@example.hr',
    email_status: 'active',
    email_step: 0,
    email_last_sent_at: '',
    website: 'https://example.hr',
    website_status: '500',
    Grad: 'Zagreb',
    phone: '+385 1 234 5678',
    pagespeed_mobile: '25'
  },
  {
    __rowIndex: 3,
    title: 'Klinika dr Ana',
    email_found: 'kontakt@klinika.hr',
    all_emails: 'kontakt@klinika.hr, ana@klinika.hr',
    email_status: 'active',
    email_step: 1,
    email_last_sent_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    website: 'https://klinika.hr',
    website_status: '200',
    has_website: 'yes',
    is_https: 'yes',
    Grad: 'Split',
    phone: '021 555 666',
    pagespeed_mobile: '45',
    has_chatbot: 'no',
    has_ga: 'yes'
  },
  {
    __rowIndex: 4,
    title: 'No email here',
    email_found: 'no',
    all_emails: '',
    email_status: 'active',
    email_step: 0
  },
  {
    __rowIndex: 5,
    title: 'Already done',
    email_found: 'x@x.com',
    all_emails: 'x@x.com',
    email_status: 'active',
    email_step: 4,
    email_last_sent_at: new Date().toISOString()
  },
  {
    __rowIndex: 6,
    title: 'Too soon follow-up',
    email_found: 'y@y.com',
    all_emails: 'y@y.com',
    email_status: 'active',
    email_step: 1,
    email_last_sent_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

console.log('=== FILTER TEST ===');
const eligible = filter.filterEligible(mockRows, 35);
console.log(`Input: ${mockRows.length} rows, Eligible: ${eligible.length}`);
console.log('Eligible row indexes:', eligible.map(r => r.__rowIndex));
const expected = [3, 2]; // followUp first (step=1, 5 days ago), then E1 (step=0). The step=4 / no-email / too-soon must be excluded.
if (JSON.stringify(eligible.map(r => r.__rowIndex)) === JSON.stringify(expected)) {
  console.log('PASS: filter returns expected order');
} else {
  console.log(`FAIL: expected ${JSON.stringify(expected)}, got ${JSON.stringify(eligible.map(r => r.__rowIndex))}`);
  process.exit(1);
}

console.log('\n=== VARIANT TEST ===');
const tests = [
  { row: { website_status: '500' }, expected: 'V1' },
  { row: { website_status: '200', has_website: 'no' }, expected: 'V2' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'no', pagespeed_mobile: 20 }, expected: 'V3' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 0 }, expected: 'V4' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_ga: 'no', has_pixel: 'no' }, expected: 'V5' },
  { row: { website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_ga: 'yes', has_pixel: 'yes', pagespeed_mobile: 80, has_meta_desc: 'yes', has_og_tags: 'yes', has_schema: 'yes' }, expected: 'V9' }
];
for (const t of tests) {
  const v = variant.pickVariant(t.row, 'ortopedija');
  const ok = v === t.expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${JSON.stringify(t.row).slice(0, 80)}... -> ${v} (expected ${t.expected})`);
  if (!ok) process.exit(1);
}

console.log('\n=== TEMPLATE TEST ===');
for (const row of eligible) {
  row.email_variant = variant.pickVariant(row, 'ortopedija');
  const email = template.buildEmail(row, ORTOPEDIJA, G);
  console.log(`\n--- row ${row.__rowIndex} | step ${row.email_step}->${email.nextStep} | variant ${row.email_variant} ---`);
  console.log(`TO: ${email.to}`);
  console.log(`SUBJECT: ${email.subject}`);
  console.log(`BODY (first 200 chars):`);
  console.log(email.body.substring(0, 200));
  // Check no unrendered placeholders
  const unrendered = email.body.match(/\{\{(\w+)\}\}/g);
  if (unrendered) {
    console.log(`WARN: unrendered placeholders found: ${unrendered.join(', ')}`);
  }
}

console.log('\n=== ALL TESTS PASSED ===');
