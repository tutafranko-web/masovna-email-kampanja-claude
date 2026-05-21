// Syntax + structure verification (no auto-run side effects expected).
const fs = require('fs');
const path = require('path');

const ok = [];
const errs = [];
for (const dir of ['src', 'templates']) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    const p = './' + dir + '/' + f;
    try {
      require(path.resolve(p));
      ok.push(p);
    } catch (e) {
      errs.push(p + ': ' + e.message);
    }
  }
}
console.log('PARSED OK:', ok.length, 'files');
ok.forEach(f => console.log('  ✓', f));
if (errs.length) {
  console.log('ERRORS:');
  errs.forEach(e => console.log('  ✗', e));
  process.exit(1);
}

// Template structure check
console.log('\n=== TEMPLATE STRUCTURE CHECK ===');
const industries = ['psihijatrija', 'ortopedija', 'medicina_rada', 'pedijatrija', 'fizioterapija', 'ginekologija', 'tour', 'oftamologija', 'wellness', 'estetske'];
const expectedKeys = {
  E1: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'],
  E2: ['DEFAULT'],
  E3: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'],
  E4: ['DEFAULT']
};
let tplErrs = 0;
const sizes = {};
for (const ind of industries) {
  const t = require('../templates/' + ind + '.js');
  let bytes = 0;
  for (const [stage, vars] of Object.entries(expectedKeys)) {
    if (!t[stage]) { console.log('  ✗', ind, 'missing', stage); tplErrs++; continue; }
    for (const v of vars) {
      if (!t[stage][v]) { console.log('  ✗', ind, 'missing', stage + '.' + v); tplErrs++; continue; }
      if (!t[stage][v].subject || !t[stage][v].body) { console.log('  ✗', ind, stage + '.' + v, 'missing subject/body'); tplErrs++; }
      bytes += (t[stage][v].subject || '').length + (t[stage][v].body || '').length;
    }
  }
  sizes[ind] = bytes;
}
console.log(tplErrs === 0 ? '✓ all 10 industries have full E1×9 + E2×1 + E3×9 + E4×1 = 20 templates each' : 'TEMPLATE ERRORS: ' + tplErrs);
console.log('Template sizes (bytes):', JSON.stringify(sizes, null, 2));
if (tplErrs > 0) process.exit(1);

// Industries config check
console.log('\n=== INDUSTRIES CONFIG CHECK ===');
const cfg = require('../industries.json');
console.log('industries:', cfg.industries.length);
const seen = new Set();
let cfgErrs = 0;
for (const i of cfg.industries) {
  if (!i.key || !i.label || !i.sheet_id || !i.gid || !i.sender_email || !i.smtp_key) {
    console.log('  ✗', i.key || '(no key)', 'missing required field');
    cfgErrs++;
  }
  if (seen.has(i.key)) { console.log('  ✗ duplicate key:', i.key); cfgErrs++; }
  seen.add(i.key);
}
const expectedKeys2 = ['psihijatrija','ortopedija','medicina_rada','pedijatrija','fizioterapija','ginekologija','tour','oftamologija','wellness','estetske'];
for (const k of expectedKeys2) {
  if (!seen.has(k)) { console.log('  ✗ missing industry config:', k); cfgErrs++; }
}
console.log(cfgErrs === 0 ? '✓ industries.json has all 10 industries with required fields' : 'CONFIG ERRORS: ' + cfgErrs);
if (cfgErrs > 0) process.exit(1);

// Global settings check
console.log('\n=== GLOBAL SETTINGS CHECK ===');
const requiredGlobals = ['reply_to', 'sender_ime', 'calendly_url', 'daily_limit_per_industry', 'smtp_host', 'smtp_port', 'smtp_secure', 'min_wait_between_sends_ms', 'max_wait_between_sends_ms', 'min_cycle_wait_ms', 'max_cycle_wait_ms', 'session_max_runtime_ms'];
let globalErrs = 0;
for (const g of requiredGlobals) {
  if (cfg.global[g] === undefined) { console.log('  ✗ missing global:', g); globalErrs++; }
}
console.log(globalErrs === 0 ? '✓ all global settings present' : 'GLOBAL ERRORS: ' + globalErrs);
process.exit(globalErrs > 0 ? 1 : 0);
