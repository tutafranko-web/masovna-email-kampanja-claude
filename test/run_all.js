// Test runner — runs all test files in sequence, fails if any fail.
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const tests = ['syntax.js', 'fixture.js', 'edge_cases.js', 'error_handling.js', 'e2e_mock.js', 'env_vars.js', 'stress.js'];
const results = [];

for (const t of tests) {
  console.log(`\n${'='.repeat(60)}\n# ${t}\n${'='.repeat(60)}`);
  const r = spawnSync('node', [path.join('test', t)], { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  results.push({ name: t, code: r.status });
}

console.log(`\n${'='.repeat(60)}\nFINAL SUMMARY\n${'='.repeat(60)}`);
let anyFail = false;
for (const r of results) {
  const status = r.code === 0 ? 'PASS' : 'FAIL';
  console.log(`  ${status}  ${r.name}`);
  if (r.code !== 0) anyFail = true;
}
process.exit(anyFail ? 1 : 0);
