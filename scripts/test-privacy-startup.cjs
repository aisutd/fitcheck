/* global __dirname, URL, setImmediate */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

async function checkStartup() {
  const root = path.resolve(__dirname, '..');
  const launches = [];
  const saved = 'EXPO_PUBLIC_SUPABASE_URL=https://saved.example\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=public-test-key\nEXPO_PUBLIC_ACTIVITY_API_URL=http://127.0.0.1:8000';
  const fileSystem = {
    existsSync: file => file === path.join(root, '.env.local') || file.endsWith('python.exe'),
    readFileSync: () => saved,
  };
  let checks = 0;
  const fakeProcess = {
    env: { EXPO_PUBLIC_SUPABASE_URL: 'https://stale.example', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' },
    platform: 'win32', execPath: 'node', argv: ['node', 'dev-web.cjs'], on() {},
  };
  const requireMock = name => {
    if (name === 'node:fs') return fileSystem;
    if (name === 'node:child_process') return { spawn(command, args, options) {
      launches.push({ command, args, options });
      const child = new EventEmitter();
      child.kill = () => {};
      return child;
    } };
    return require(name);
  };
  requireMock.resolve = () => 'expo-cli';
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'dev-web.cjs'), 'utf8'), {
    __dirname, require: requireMock, process: fakeProcess, URL,
    console: { log() {}, error(message) { throw new Error(message); } },
    AbortSignal: { timeout() {} },
    fetch: async () => ({ ok: ++checks > 1, json: async () => ({ app: 'fitcheck-privacy' }) }),
    setTimeout: callback => callback(),
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(launches.length, 2, 'Start the missing backend and then Expo');
  assert.equal(launches[0].options.cwd, path.join(root, 'services', 'privacy'));
  assert.equal(launches[1].options.cwd, root, 'Launch Expo from the integrated app');
  const frontend = launches[1];
  assert.ok(frontend.args.includes('--clear'), 'Discard cached missing-configuration bundles');
  assert.equal(frontend.options.env.EXPO_PUBLIC_SUPABASE_URL, 'https://saved.example');
  assert.equal(frontend.options.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'public-test-key');
  assert.deepEqual(Array.from(frontend.args).slice(0, 6), ['expo-cli', 'start', '--web', '--port', '8081', '--clear']);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.scripts.start, manifest.scripts.web, 'Both entry points use the same startup');
  console.log('Privacy startup regression checks passed.');
}
checkStartup().catch(error => { console.error(error); process.exitCode = 1; });
