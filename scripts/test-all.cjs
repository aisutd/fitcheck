/* global __dirname */
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const suites = readdirSync(__dirname).filter((name) => /^test-.*\.cjs$/.test(name) && name !== 'test-all.cjs').sort();
for (const suite of suites) {
  const result = spawnSync(process.execPath, [join(__dirname, suite)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`All ${suites.length} logic suites passed. Device, live API and dataset evaluation are separate checks.`);
