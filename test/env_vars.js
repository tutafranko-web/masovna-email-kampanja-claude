// Test env var parsing for send.js entry behavior (without invoking main loop)
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const STATE_PATH = path.resolve(__dirname, '..', 'state', 'today.json');
if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);

// Backup creds so we can test the "missing creds" path (restored at end)
const SA = path.resolve(__dirname, '..', 'credentials', 'service-account.json');
const OAUTH = path.resolve(__dirname, '..', 'credentials', 'oauth.json');
const backupSA = fs.existsSync(SA) ? fs.readFileSync(SA) : null;
const backupOAUTH = fs.existsSync(OAUTH) ? fs.readFileSync(OAUTH) : null;
if (backupSA) fs.unlinkSync(SA);
if (backupOAUTH) fs.unlinkSync(OAUTH);

let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name, info ? '— ' + info : ''); }
}

console.log('=== Env var CLI behavior (send.js subprocess) ===');

function runSend(env, timeoutMs = 5000) {
  const r = spawnSync('node', ['src/send.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, ...env },
    timeout: timeoutMs,
    encoding: 'utf8'
  });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '', signal: r.signal };
}

// Test 1: DRY_RUN+INDUSTRY=ortopedija - should attempt to read sheet and fail with clear SA error, NOT auto-sleep
console.log('\n  Test: DRY_RUN=true INDUSTRY=ortopedija (no SA — expect quick error exit)');
const r1 = runSend({ DRY_RUN: 'true', INDUSTRY: 'ortopedija' });
assert('DRY_RUN+INDUSTRY printed start banner', r1.stdout.includes('Starting masovna-email-kampanja-claude. DRY_RUN=true ONLY=ortopedija'));
assert('DRY_RUN+INDUSTRY tried to read sheet', r1.stdout.includes('ortopedija') && r1.stdout.includes('No Google credentials found'));
assert('Exited (not hung)', r1.signal !== 'SIGTERM');

// Test 2: Unknown industry
console.log('\n  Test: INDUSTRY=nonsense (unknown industry)');
const r2 = runSend({ DRY_RUN: 'true', INDUSTRY: 'nonsense' });
assert('Unknown industry rejected with exit code 1', r2.code === 1, `code=${r2.code}`);
assert('Error message lists valid industries', r2.stderr.includes('Unknown industry') && r2.stderr.includes('Valid:'), r2.stderr.slice(0, 100));

// Test 3: LIMIT respected
console.log('\n  Test: LIMIT=5 affects start banner');
const r3 = runSend({ DRY_RUN: 'true', INDUSTRY: 'ortopedija', LIMIT: '5' });
assert('LIMIT=5 reflected in banner', r3.stdout.includes('LIMIT_OVERRIDE=5'), r3.stdout.slice(0, 200));

// Cleanup
if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);
// Restore creds
if (backupSA) fs.writeFileSync(SA, backupSA);
if (backupOAUTH) fs.writeFileSync(OAUTH, backupOAUTH);

console.log(`\nTotal: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
