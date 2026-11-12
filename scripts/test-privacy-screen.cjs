/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, dependencies) {
  const filename = path.join(__dirname, '..', relative);
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename.replace(/\.js$/, '.tsx'),
  }).outputText;
  vm.runInNewContext(code, {
    exports, process: { env: {} },
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

// With no configuration, importing the cloud module must not initialize a client
// or crash the screen. A cloud action must still fail instead of pretending to save.
const cloud = load('src/features/privacy/lib/supabase.ts', {
  'react-native-url-polyfill/auto': {},
  '@react-native-async-storage/async-storage': {},
  '@supabase/supabase-js': { createClient() { throw new Error('Client initialized during import'); } },
  'react-native': { Platform: { OS: 'web' } },
  './activityConfig': { activityApiUrl: '' },
});
assert.throws(() => cloud.getPrivacyClient(), /Cloud connection unavailable/);

const screen = () => {};
const route = load('src/app/privacy.js', {
  'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  react: { useState: () => [0, () => {}], useEffect: () => {} },
  'react-native': { Text: 'Text', View: 'View' },
  'expo-router': { router: {} },
  '../components/FeaturePage': { ui: { body: {} } },
  '../features/privacy/App': { PrivacyDataScreen: screen },
  '../features/privacy/lib/privacyApi': { onPrivacyReset() {} },
});
const rendered = route.default();
assert.ok(rendered.props.children.some(child => child.type === screen), 'Render the full privacy screen without environment settings');
assert.ok(!JSON.stringify(rendered).includes('Cloud privacy controls are unavailable'));
console.log('Privacy screen renders without configuration; cloud actions fail honestly.');
