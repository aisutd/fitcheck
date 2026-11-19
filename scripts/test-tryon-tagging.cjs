/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { buildGarmentDescription } = require('../src/features/tryon/garmentDescription');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const photo = name => ({ uri: `file:///${name}.jpg`, width: 400, height: 600, type: 'image', mimeType: 'image/jpeg' });
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/features/tryon/VirtualTryOn.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

// Run the actual screen handlers with small hook and JSX adapters; no React Native renderer,
// personal photos, recognition model or GPU is needed for these async workflow checks.
function screen(initialGarment = null) {
  let cursor = 0, picked = null;
  const slots = [], effects = [], moduleExports = {}, state = { tagCalls: 0, modelCalls: 0, recognition: null };
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!effects[index] || deps.some((value, i) => value !== effects[index].deps[i])) {
        effects[index]?.cleanup?.();
        effects[index] = { deps, cleanup: effect() };
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(source, {
    exports: moduleExports, AbortController, setInterval: () => 1, clearInterval: () => {},
    require(name) {
      if (name === 'react') return { __esModule: true, default: {}, ...hooks };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return { Platform: { OS: 'web' }, StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 600, height: 900 }) };
      if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
      if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
      if (name === './photos') return { chooseImage: async () => picked, validPhoto: value => !!value?.uri };
      if (name === './client') return { generateTryOn: async () => { state.modelCalls++; return 'data:image/png;base64,result'; } };
      if (name === '../recognition/photoService') return { tagPhoto: () => { state.tagCalls++; return state.recognition.promise; } };
      if (name === './garmentDescription') return { buildGarmentDescription };
      throw Error(`Unexpected import ${name}`);
    },
  });
  function find(node, name) {
    if (!node || typeof node !== 'object') return null;
    if (node.type?.name === name) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const match = find(child, name); if (match) return match; }
    return null;
  }
  function render() { cursor = 0; return moduleExports.default({ initialGarment, onClose: () => {} }); }
  function component(name) { return find(render(), name).props; }
  return {
    state, component,
    async choose(tab, value) {
      component('UploadTabs').onSelect(tab);
      component('PhotoUploadCard').onChoose();
      picked = value;
      const pending = component('PhotoSourceSelector').onSelect(false);
      await Promise.resolve(); await Promise.resolve();
      return { pending };
    },
    unmount() { effects.forEach(effect => effect?.cleanup?.()); },
  };
}

(async () => {
  const view = screen();
  await (await view.choose('Your Photo', photo('person'))).pending;
  assert.equal(view.state.tagCalls, 0, 'Never recognize the person photo');
  view.state.recognition = deferred();
  const upload = await view.choose('Garment', photo('garment'));
  assert.equal(view.component('PhotoUploadCard').photo.uri, photo('garment').uri, 'Preview before tagging completes');
  assert.equal(view.component('Button').disabled, true, 'Generate blocked while tagging');
  await view.component('Button').onPress();
  assert.equal(view.state.modelCalls, 0);
  view.state.recognition.resolve({ color: 'Black', fit: 'Fitted', material: 'Cotton', item: 'Tank Top' });
  await upload.pending;
  assert.equal(view.component('PhotoUploadCard').photo.garmentDescription, 'black fitted cotton tank top');
  assert.equal(view.component('Button').disabled, false);
  await (await view.choose('Garment', null)).pending;
  assert.equal(view.state.tagCalls, 1, 'Cancel must preserve tags without another recognition call');
  assert.equal(view.component('PhotoUploadCard').photo.garmentDescription, 'black fitted cotton tank top');

  view.state.recognition = deferred();
  const replacement = await view.choose('Garment', photo('replacement'));
  assert.equal(view.component('PhotoUploadCard').photo.garmentDescription, undefined, 'Old tags must not describe a replacement');
  view.state.recognition.reject(Error('Recognition unavailable'));
  await replacement.pending;
  assert.equal(view.component('Button').disabled, false, 'Fallback remains usable');
  assert.equal(view.component('PhotoUploadCard').photo.garmentDescription, undefined);
  await view.component('Button').onPress();
  assert.equal(view.state.modelCalls, 1);

  view.state.recognition = deferred();
  const invalidated = await view.choose('Garment', photo('broken-preview'));
  view.component('PhotoUploadCard').onError();
  view.state.recognition.resolve({ item: 'Shirt' });
  await invalidated.pending;
  assert.equal(view.component('PhotoUploadCard').photo, null, 'Late tags cannot restore an invalidated image');
  view.unmount();
  console.log('Fresh garment tagging, person exclusion, preview, generation guard, cancellation, replacement fallback and late-response checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
