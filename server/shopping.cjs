const http = require('node:http');
const { validateSearch, buildShoppingQuery, normalizeProducts } = require('../src/features/shopping/shoppingModel');

function createShoppingServer({ apiKey = process.env.SERPAPI_KEY, fetchImpl = fetch,
  allowedOrigin = process.env.SHOPPING_WEB_ORIGIN || 'http://localhost:8081',
  hourlyLimit = 30, now = Date.now } = {}) {
  const cache = new Map();
  const pending = new Map();
  let windowStart = now();
  let calls = 0;
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && origin !== allowedOrigin) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'This web origin is not allowed.' }));
    }
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      ...(origin ? { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } : {}) };
    const send = (status, body) => { res.writeHead(status, headers); res.end(JSON.stringify(body)); };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' });
      return res.end();
    }
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') return send(200, { status: 'ok', shoppingConfigured: Boolean(apiKey) });
    if (req.method !== 'GET' || url.pathname !== '/shopping') return send(404, { error: 'Not found.' });
    let input;
    try { input = validateSearch(Object.fromEntries(url.searchParams)); }
    catch (error) { return send(400, { error: error.message }); }
    if (!apiKey) return send(503, { error: 'Live shopping is not configured yet. Your wardrobe still works.' });
    const query = buildShoppingQuery(input);
    const cached = cache.get(query);
    try {
      let result = cached && now() - cached.at < 10 * 60 * 1000 ? cached : null;
      if (!result) {
        if (!pending.has(query)) {
          if (now() - windowStart >= 3600000) { windowStart = now(); calls = 0; }
          if (calls >= hourlyLimit) return send(429, { error: 'Shopping search limit reached. Please try again later.' });
          calls += 1;
          const request = (async () => {
            const upstream = new URL('https://serpapi.com/search.json');
            upstream.search = new URLSearchParams({ engine: 'google_shopping', q: query, gl: 'us', hl: 'en', api_key: apiKey }).toString();
            const response = await fetchImpl(upstream, { signal: AbortSignal.timeout(12000) });
            if (!response.ok) throw new Error('Shopping provider unavailable');
            const data = await response.json();
            if (data.error) throw new Error('Shopping provider unavailable');
            const entry = { products: normalizeProducts(data.shopping_results), at: now() };
            if (cache.size >= 100) cache.delete(cache.keys().next().value);
            cache.set(query, entry);
            return entry;
          })();
          pending.set(query, request);
          request.finally(() => pending.delete(query)).catch(() => {});
        }
        result = await pending.get(query);
      }
      return send(200, { products: result.products.filter((item) => input.maxPrice === null || item.price <= input.maxPrice).slice(0, 12),
        query, source: 'Google Shopping via SerpApi', fetchedAt: new Date(result.at).toISOString() });
    } catch {
      // Never return upstream errors or URLs, which can contain the private API key.
      return send(502, { error: 'Shopping is temporarily unavailable. Please try again.' });
    }
  });
}
if (require.main === module) {
  createShoppingServer().listen(Number(process.env.PORT) || 8787, '0.0.0.0', () => console.log('FitCheck shopping server started.'));
}
module.exports = { createShoppingServer };
