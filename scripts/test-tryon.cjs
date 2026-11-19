/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildGarmentDescription } = require('../src/features/tryon/garmentDescription');

assert.equal(buildGarmentDescription({ recognition: { color: 'Black', fit: 'Fitted', material: 'Cotton', item: 'Tank Top' } }), 'black fitted cotton tank top');
assert.equal(buildGarmentDescription({ color: 'Black', fit: 'Slim/Fitted', material: 'Cotton', clothingType: 'Tank Top' }), 'black fitted cotton tank top');
assert.equal(buildGarmentDescription({ color: 'Blue', clothingType: 'Shirt', recognition: { color: 'Red', item: 'Tank Top' } }), 'blue shirt');
assert.equal(buildGarmentDescription({ recognition: { color: null, fit: 'Not Applicable', material: 'Unknown', item: 'Tank Top', scores: {} } }), 'tank top');
assert.equal(buildGarmentDescription({ category: 'top' }), 'top');
assert.equal(buildGarmentDescription(), 'a clothing item');
assert(buildGarmentDescription({ clothingType: 'x'.repeat(600) }).length <= 500);

// Exercise the real upload client with a mocked native transport (no live photos or GPU).
const requests = [];
class Form { constructor() { this.fields = []; } append(...args) { this.fields.push(args); } }
class Request {
  open(method, url) { this.method = method; this.url = url; }
  send(form) { requests.push(form.fields); this.status = 200; this.response = { type: 'image/png' }; this.onload(); }
}
class Reader { readAsDataURL() { this.result = 'data:image/png;base64,fixture'; this.onload(); } }
const source = fs.readFileSync(path.join(__dirname, '../src/features/tryon/client.js'), 'utf8')
  .replace("import { Platform } from 'react-native';", "const Platform = { OS: 'ios' };")
  .replace('export async function generateTryOn', 'exports.generateTryOn = async function generateTryOn');
const exportsForClient = {};
vm.runInNewContext(source, { exports: exportsForClient, process: { env: {} }, FormData: Form, XMLHttpRequest: Request, FileReader: Reader });
(async () => {
  const person = { uri: 'file:///person.jpg' };
  const garment = { uri: 'file:///garment.jpg', garmentDescription: 'black fitted cotton tank top' };
  await exportsForClient.generateTryOn(person, garment);
  await exportsForClient.generateTryOn(person, { uri: 'file:///replacement.jpg' });
  assert.equal(requests[0].find(([key]) => key === 'description')[1], 'black fitted cotton tank top');
  assert.equal(requests[1].find(([key]) => key === 'description')[1], 'a clothing item');
  assert.deepEqual(Array.from(requests[0], ([key]) => key), ['description', 'person', 'garment']);
  console.log('Try-on description, upload fields, and replacement fallback checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
