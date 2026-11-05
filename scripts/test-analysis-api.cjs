const assert = require('node:assert/strict');
(async () => {
 process.env.GEMINI_API_KEY = '';
 const { app } = await import('../services/analysis/src/index.js');
 const server = app.listen(0, '127.0.0.1');
 await new Promise((resolve) => server.once('listening', resolve));
 const url = `http://127.0.0.1:${server.address().port}`;
 try {
  const health = await (await fetch(url + '/health')).json(); assert.equal(health.configured, false); assert.equal(health.schemaVersion, 5);
  assert.equal((await fetch(url + '/api/bias/analyze', { method: 'POST' })).status, 503);
  assert.equal((await fetch(url + '/health', { headers: { Origin: 'https://unapproved.example' } })).status, 403);
  process.env.GEMINI_API_KEY = 'fixture';
  const invalid = new FormData(); invalid.append('image', new Blob(['not a PNG'], { type: 'image/png' }), 'bad.png');
  assert.equal((await fetch(url + '/api/bias/analyze', { method: 'POST', body: invalid })).status, 400);
  delete process.env.GEMINI_API_KEY;
  console.log('Passed Gemini API startup, schema health, missing credentials, origin enforcement and invalid image rejection; no model call made.');
 } finally { await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
