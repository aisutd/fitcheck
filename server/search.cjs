const http = require('node:http');

const PORT = Number(process.env.SEARCH_PORT) || 5001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'POST' || url.pathname !== '/api/search-ai') {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'Not found.' }));
  }

  if (!GROQ_API_KEY) {
    res.writeHead(500);
    return res.end(JSON.stringify({ error: 'GROQ_API_KEY is missing in server/.env' }));
  }

  let rawBody = '';
  for await (const chunk of req) rawBody += chunk;

  let query = '';
  try {
    query = JSON.parse(rawBody).query?.trim() || '';
  } catch {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Invalid JSON request.' }));
  }

  if (!query) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Query is required.' }));
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a fashion stylist. Given an occasion or style query, return ONLY valid JSON with exact keys: "title" (string), "matched_category" (string), "items" (array of 3-5 clothing/accessory strings), and "styling_tip" (string).',
          },
          { role: 'user', content: query },
        ],
      }),
    });

    const data = await groqRes.json();
    if (!groqRes.ok) {
      throw new Error(data.error?.message || 'Groq API request failed.');
    }

    const parsed = JSON.parse(data.choices[0].message.content);
    res.writeHead(200);
    return res.end(JSON.stringify(parsed));
  } catch (err) {
    res.writeHead(502);
    return res.end(JSON.stringify({ error: err.message || 'AI search failed.' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FitCheck AI Search server running on port ${PORT}`);
});