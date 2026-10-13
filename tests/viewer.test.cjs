const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const exportsForMath = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/viewerMath.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsForMath });
const { clampZoom, nearestAngle, fitDistance } = exportsForMath;
test('zoom stays bounded and all rotations fit even at maximum zoom', () => {
  assert.equal(clampZoom(.01), .8);
  assert.equal(clampZoom(100), 1.2);
  for (const aspect of [.45, .65, 1, 2]) {
    const height = 1.76, diameter = Math.hypot(.66, .36);
    const distance = fitDistance(height, diameter, aspect) / clampZoom(100);
    const halfVertical = distance * Math.tan(32 * Math.PI / 360);
    assert(halfVertical * 2 > height);
    assert(halfVertical * 2 * aspect > diameter);
  }
});
test('presets take the shortest path after repeated full rotations', () => {
  for (const current of [-19, -7, 0, 8, 22]) for (const desired of [0, Math.PI / 2, Math.PI]) {
    const target = nearestAngle(current, desired);
    assert(Math.abs(target - current) <= Math.PI + 1e-10);
    assert(Math.abs(Math.sin(target) - Math.sin(desired)) < 1e-10);
    assert(Math.abs(Math.cos(target) - Math.cos(desired)) < 1e-10);
  }
});
test('avatar geometry and every texture are local and parseable', async () => {
  const buffer = fs.readFileSync(path.join(root, 'assets/avatar/demo.glb'));
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF');
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength));
  assert(json.meshes.length > 0);
  assert(!json.buffers.some(buffer => buffer.uri));
  const binaryStart = 28 + jsonLength;
  json.images.forEach((image, index) => {
    assert.equal(image.mimeType, 'image/png');
    assert(!image.uri);
    const view = json.bufferViews[image.bufferView];
    const extracted = fs.readFileSync(path.join(root, `assets/avatar/texture-${index}.png`));
    assert.deepEqual(extracted, buffer.subarray(binaryStart + view.byteOffset, binaryStart + view.byteOffset + view.byteLength));
  });
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  // Test real geometry parsing without browser/native image decoding.
  loader.register(() => ({ name: 'TEST_TEXTURES', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
  const avatar = (await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '')).scene;
  const size = new THREE.Box3().setFromObject(avatar).getSize(new THREE.Vector3());
  assert(size.y > 1.5 && size.y < 2.1);
  assert(size.x > .25 && size.x < 1);
});
