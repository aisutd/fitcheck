const assert = require('node:assert/strict');
const { createApp } = require('../services/search/server.cjs');
async function withServer(app, run) {
 const server = app.listen(0, '127.0.0.1');
 await new Promise((resolve) => server.once('listening', resolve));
 const url = `http://127.0.0.1:${server.address().port}`;
 try { await run(url); } finally { await new Promise((resolve) => server.close(resolve)); }
}
const post = (url, query) => fetch(url + '/api/search-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
(async () => {
 await withServer(createApp({ apiKey: '' }), async (url) => {
  assert.equal((await post(url, '')).status, 400); assert.equal((await post(url, {})).status, 400);
  assert.equal((await post(url, 'Work')).status, 503);
 });
 const outfit = { category: 'Work', title: 'Linen layers', items: ['Linen shirt', 'Trousers'], styling_tip: 'Keep the palette simple.' };
 await withServer(createApp({ apiKey: 'fixture', fetchImpl: async (url, init) => {
  assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(init.headers.Authorization, 'Bearer fixture');
  const body = JSON.parse(init.body); assert.equal(body.messages[1].content, 'Work'); assert.equal(body.model, 'openai/gpt-oss-120b');
  return Response.json({ choices: [{ message: { content: JSON.stringify(outfit) } }] });
 } }), async (url) => { const response = await post(url, 'Work'); assert.equal(response.status, 200); const data = await response.json(); assert.deepEqual(data.items, outfit.items); assert.equal(data.matched_category, 'Work'); });
 await withServer(createApp({ apiKey: 'fixture', fetchImpl: async () => Response.json({ choices: [{ message: { content: '{}' } }] }) }), async (url) => assert.equal((await post(url, 'Work')).status, 502));
 console.log('Passed real HTTP search validation, missing credentials, original Groq request/response contract and invalid provider response checks; provider calls mocked.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
