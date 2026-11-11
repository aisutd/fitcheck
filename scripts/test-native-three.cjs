/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const config = require('../metro.config');

(async () => {
  const entry = require.resolve('three');
  const source = fs.readFileSync(entry, 'utf8');
  // Reproduce the installed Node-only entry's failure with Hermes-style process.
  if (source.includes('process.emitWarning(')) {
    assert.throws(() => vm.runInNewContext(source, {
      process: { env: {} }, module: { exports: {} },
      require() { throw new Error('The Node shim must fail before require(esm).'); },
    }), /emitWarning.*not a function/);
  }
  for (const platform of ['ios', 'android', 'web']) {
    const result = config.resolver.resolveRequest({ resolveRequest() { throw new Error('Unexpected fallback'); } }, 'three', platform);
    assert.equal(result.type, 'sourceFile');
    assert.equal(path.basename(result.filePath), 'three.module.js');
    assert.ok(fs.existsSync(result.filePath));
    assert.ok(!fs.readFileSync(result.filePath, 'utf8').includes('process.emitWarning('));
    const three = await import(pathToFileURL(result.filePath).href);
    assert.equal(typeof three.WebGLRenderer, 'function');
    assert.equal(typeof three.LoaderUtils.extractUrlBase, 'function');
  }
  const fallback = { type: 'sourceFile', filePath: '/unchanged.js' };
  assert.equal(config.resolver.resolveRequest({ resolveRequest(context, name, platform) {
    assert.equal(name, 'expo-router'); assert.equal(platform, 'ios'); return fallback;
  } }, 'expo-router', 'ios'), fallback);
  console.log('Passed native Three.js entry regression: reproduced Hermes-style failure, resolved portable ESM on all platforms, preserved other module resolution.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
