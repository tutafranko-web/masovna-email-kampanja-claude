// End-to-end test with mocked sheets + smtp modules.
// Exercises src/send.js's processIndustry without needing real credentials.

const Module = require('module');
const path = require('path');
const fs = require('fs');

const sentEmails = [];
const sheetUpdates = [];

// Mock sheets and smtp via require cache injection
const sheetsMock = {
  readRows: async (sheetId, gid) => {
    return [
      { __rowIndex: 2, __row: { set: (k, v) => sheetUpdates.push({ row: 2, [k]: v }), save: async () => {} }, title: 'Test Klinika 1', email_found: 'k1@test.hr', all_emails: 'k1@test.hr', email_status: 'active', email_step: 0, website: 'https://k1.hr', website_status: '500', Grad: 'Zagreb', phone: '+38512345678' },
      { __rowIndex: 3, __row: { set: (k, v) => sheetUpdates.push({ row: 3, [k]: v }), save: async () => {} }, title: 'Test Klinika 2', email_found: 'k2@test.hr', all_emails: 'k2@test.hr', email_status: 'active', email_step: 1, website: 'https://k2.hr', website_status: '200', has_website: 'yes', is_https: 'yes', total_pages: 5, has_sitemap: 'yes', has_ga: 'yes', has_pixel: 'yes', has_chatbot: 'yes', pagespeed_mobile: 80, has_meta_desc: 'yes', has_og_tags: 'yes', has_schema: 'yes', email_last_sent_at: new Date(Date.now() - 5 * 86400000).toISOString(), Grad: 'Split' }
    ];
  },
  updateRow: async (row, updates) => {
    for (const [k, v] of Object.entries(updates)) row.set(k, v);
    await row.save();
  },
  getSheet: async () => {}
};

const smtpMock = {
  sendMail: async (industry, globals, email) => {
    sentEmails.push({ industry: industry.key, from: industry.sender_email, to: email.to, subject: email.subject, body_len: email.body.length });
    return { messageId: 'mock-' + Date.now() };
  }
};

// Install mocks BEFORE requiring send.js
require.cache[require.resolve('../src/sheets')] = { exports: sheetsMock };
require.cache[require.resolve('../src/smtp')] = { exports: smtpMock };

// Clean state
const STATE_PATH = path.resolve(__dirname, '..', 'state', 'today.json');
if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);

const send = require('../src/send');
const state = require('../src/state');
const config = require('../industries.json');

let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name, info ? '— ' + info : ''); }
}

(async () => {
  console.log('=== E2E with mocked sheets+smtp ===');
  const ortopedija = config.industries.find(i => i.key === 'ortopedija');
  const keys = config.industries.map(i => i.key);
  const st = state.load(keys);

  // First call should process row 3 (followup priority over E1)
  const r1 = await send.processIndustry(ortopedija, st);
  assert('processIndustry returns "sent" with mocked SMTP', r1 === 'sent', `got ${r1}`);
  assert('state.sent.ortopedija = 1 after first send', st.sent.ortopedija === 1);
  assert('sentEmails has 1 entry', sentEmails.length === 1);
  assert('Email FROM uses industry sender_email', sentEmails[0].from === ortopedija.sender_email);
  assert('Email TO is k2@test.hr (follow-up first)', sentEmails[0].to === 'k2@test.hr', `got ${sentEmails[0].to}`);
  assert('Subject not empty', sentEmails[0].subject && sentEmails[0].subject.length > 0);
  assert('Body not empty', sentEmails[0].body_len > 100);
  assert('Sheet update wrote email_step', sheetUpdates.some(u => u.email_step === 2));
  assert('Sheet update wrote email_last_sent_at', sheetUpdates.some(u => u.email_last_sent_at));

  console.log('\n  Sent email details:');
  console.log('   - industry:', sentEmails[0].industry);
  console.log('   - from:', sentEmails[0].from);
  console.log('   - to:', sentEmails[0].to);
  console.log('   - subject:', sentEmails[0].subject);
  console.log('   - body bytes:', sentEmails[0].body_len);

  console.log('\n=== DRY_RUN mode ===');
  sentEmails.length = 0;
  sheetUpdates.length = 0;
  process.env.DRY_RUN = 'true';
  delete require.cache[require.resolve('../src/send')];
  delete require.cache[require.resolve('../src/state')];
  const sendDry = require('../src/send');
  const stateDry = require('../src/state');
  const st2 = stateDry.load(keys);
  st2.sent.ortopedija = 0;  // reset
  const r2 = await sendDry.processIndustry(ortopedija, st2);
  assert('DRY_RUN returns "dry"', r2 === 'dry', `got ${r2}`);
  assert('DRY_RUN does NOT send', sentEmails.length === 0);
  assert('DRY_RUN does NOT update sheet', sheetUpdates.length === 0);
  assert('DRY_RUN does NOT increment state', st2.sent.ortopedija === 0);

  console.log('\n=== Cap respected ===');
  process.env.DRY_RUN = '';
  delete require.cache[require.resolve('../src/send')];
  const sendCap = require('../src/send');
  st.sent.ortopedija = 35;
  const r3 = await sendCap.processIndustry(ortopedija, st);
  assert('At cap returns "capped"', r3 === 'capped', `got ${r3}`);

  console.log('\n=== No eligible rows ===');
  require.cache[require.resolve('../src/sheets')] = { exports: { ...sheetsMock, readRows: async () => [] } };
  delete require.cache[require.resolve('../src/send')];
  const sendNo = require('../src/send');
  const st4 = stateDry.load(keys);
  st4.sent.ortopedija = 0;
  const r4 = await sendNo.processIndustry(ortopedija, st4);
  assert('Empty sheet returns "no-eligible"', r4 === 'no-eligible', `got ${r4}`);

  console.log('\n=== SMTP error handling ===');
  require.cache[require.resolve('../src/sheets')] = { exports: sheetsMock };
  require.cache[require.resolve('../src/smtp')] = { exports: { sendMail: async () => { throw new Error('connect ETIMEDOUT'); } } };
  delete require.cache[require.resolve('../src/send')];
  const sendErr = require('../src/send');
  const st5 = stateDry.load(keys);
  st5.sent.ortopedija = 0;
  const r5 = await sendErr.processIndustry(ortopedija, st5);
  assert('SMTP throw returns "smtp-error"', r5 === 'smtp-error', `got ${r5}`);
  assert('state NOT incremented after smtp failure', st5.sent.ortopedija === 0);

  // Cleanup
  if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);

  console.log(`\nTotal: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
})();
