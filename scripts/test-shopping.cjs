const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createShoppingServer } = require('../server/shopping.cjs');
const { normalizeProducts, validateSearch, buildShoppingQuery, safeHttps } = require('../src/features/shopping/shoppingModel');
const product = { product_id: 'one', title: 'Linen shirt', source: 'Example retailer', price: '$35.00', extracted_price: 35,
  product_link: 'https://example.com/shirt', thumbnail: 'https://example.com/shirt.jpg' };
assert.equal(normalizeProducts([null, product, product]).length, 1);
assert.equal(normalizeProducts([product], 20).length, 0);
assert.equal(normalizeProducts([{ ...product, price: '£35.00' }]).length, 0);
assert.equal(normalizeProducts([{ ...product, product_link: 'javascript:alert(1)' }]).length, 0);
assert.equal(normalizeProducts([{ ...product, extracted_price: NaN }]).length, 0);
assert.equal(normalizeProducts([{ ...product, thumbnail: 'http://example.com/a' }])[0].image, null);
assert.equal(safeHttps('https://user:password@example.com'), null);
assert.throws(() => validateSearch({ occasion: 'Date Night', category: 'top', maxPrice: 'abc' }));
assert.throws(() => validateSearch({ occasion: 'Date Night', category: 'top', maxPrice: '0.001' }));
assert.throws(() => validateSearch({ occasion: 'invalid', category: 'top' }));
assert.throws(() => validateSearch({ occasion: 'Work', category: 'toString' }));
assert.ok(buildShoppingQuery({ occasion: 'Date Night', category: 'top', style: 'minimalist' }).includes('minimalist Date Night'));
async function withServer(options, run) {
  const server = createShoppingServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}
(async () => {
  let calls = 0;
  await withServer({ apiKey: 'test-private-key', hourlyLimit: 1, fetchImpl: async (url) => {
    calls += 1;
    assert.equal(url.hostname, 'serpapi.com');
    assert.equal(url.searchParams.get('api_key'), 'test-private-key');
    assert.equal(url.searchParams.get('gl'), 'us');
    return { ok: true, json: async () => ({ shopping_results: [product] }) };
  } }, async (base) => {
    const path = '/shopping?occasion=Date+Night&category=top';
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.ok(!text.includes('test-private-key'));
    assert.equal(JSON.parse(text).products.length, 1);
    assert.equal((await (await fetch(base + path + '&maxPrice=20')).json()).products.length, 0);
    assert.equal(calls, 1, 'budget changes reuse cached provider results');
    assert.equal((await fetch(base + '/shopping?occasion=Date+Night&category=shoes')).status, 429);
    assert.equal((await fetch(base + path, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(base + '/shopping?occasion=invalid&category=top')).status, 400);
  });
  let coalescedCalls = 0;
  await withServer({ apiKey: 'test', fetchImpl: async () => {
    coalescedCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { ok: true, json: async () => ({ shopping_results: [product] }) };
  } }, async (base) => {
    const path = '/shopping?occasion=Work&category=top';
    const results = await Promise.all([fetch(base + path), fetch(base + path)]);
    assert.ok(results.every((result) => result.status === 200));
    assert.equal(coalescedCalls, 1, 'concurrent searches share one provider request');
  });
  await withServer({ apiKey: '' }, async (base) => {
    assert.deepEqual(await (await fetch(base + '/health')).json(), { status: 'ok', shoppingConfigured: false });
    assert.equal((await fetch(base + '/shopping?occasion=Work&category=top')).status, 503);
  });
  await withServer({ apiKey: 'secret', fetchImpl: async () => { throw new Error('secret'); } }, async (base) => {
    const response = await fetch(base + '/shopping?occasion=Work&category=top');
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes('secret'));
  });
  console.log('Passed shopping normalization, budget, USD, link safety, real HTTP routing, caching, limits, configuration and provider-failure checks (mock provider; no live API calls).');
})().catch((error) => { console.error(error); process.exitCode = 1; });
