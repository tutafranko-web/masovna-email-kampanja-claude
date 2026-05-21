// Verifies graceful error messages when credentials missing.
const path = require('path');
const fs = require('fs');

let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name, info ? '— ' + info : ''); }
}

// Test 1: sheets.js throws clean error when SA JSON missing
console.log('=== Missing credentials handling ===');
const SA = path.resolve(__dirname, '..', 'credentials', 'service-account.json');
const SMTP = path.resolve(__dirname, '..', 'credentials', 'smtp.json');
const backupSA = fs.existsSync(SA) ? fs.readFileSync(SA) : null;
const backupSMTP = fs.existsSync(SMTP) ? fs.readFileSync(SMTP) : null;
if (backupSA) fs.unlinkSync(SA);
if (backupSMTP) fs.unlinkSync(SMTP);

const sheets = require('../src/sheets');
const smtp = require('../src/smtp');

(async () => {
  try {
    await sheets.readRows('fakeId', '0');
    assert('sheets.readRows without SA should throw', false, 'no error thrown');
  } catch (e) {
    assert('sheets error has clear message', e.message.includes('Service account JSON not found') && e.message.includes('CREDENTIALS_SETUP.md'), e.message);
  }

  try {
    await smtp.sendMail({ smtp_key: 'a1', sender_email: 'x@x.com' }, { smtp_host: 'localhost', smtp_port: 25, smtp_secure: false, reply_to: 'x@x.com', sender_ime: 'X' }, { to: 'y@y.com', subject: 's', body: 'b' });
    assert('smtp.sendMail without creds should throw', false, 'no error thrown');
  } catch (e) {
    assert('smtp error has clear message', e.message.includes('SMTP credentials not found') && e.message.includes('CREDENTIALS_SETUP.md'), e.message);
  }

  // Restore
  if (backupSA) fs.writeFileSync(SA, backupSA);
  if (backupSMTP) fs.writeFileSync(SMTP, backupSMTP);

  // Test 2: SMTP with wrong key
  if (backupSMTP) {
    try {
      const smtpFresh = require('../src/smtp');
      // bust transporter cache by sending with unknown key
      await smtpFresh.sendMail({ smtp_key: 'XX_UNKNOWN', sender_email: 'x@x.com' }, { smtp_host: 'localhost', smtp_port: 25, smtp_secure: false, reply_to: 'x@x.com', sender_ime: 'X' }, { to: 'y@y.com', subject: 's', body: 'b' });
      assert('unknown SMTP key should throw', false);
    } catch (e) {
      assert('unknown SMTP key error has clear message', e.message.includes('No SMTP creds for key'), e.message);
    }
  } else {
    console.log('  (skipping unknown-key test — no real smtp.json to restore)');
  }

  console.log(`\nTotal: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
})();
