const express = require('express');
const cors = require('cors');

function createApp({ apiKey = process.env.GROQ_API_KEY, fetchImpl = fetch, hourlyLimit = 60, now = Date.now } = {}) {
const app = express();


app.use(express.json({ limit: '16kb' }));
app.use(cors());
let windowStart = now(); let calls = 0;

// ==========================================
// Insert your Groq API Key below
// ==========================================
const GROQ_API_KEY = apiKey;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fully open-ended AI Search Endpoint
app.post('/api/search-ai', async (req, res) => {
  const { query } = req.body || {};


  if (typeof query !== 'string' || !query.trim() || query.length > 2000) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI search is not configured.' });
  if (now() - windowStart >= 3600000) { windowStart = now(); calls = 0; }
  if (calls >= hourlyLimit) return res.status(429).json({ error: 'AI search limit reached. Please try again later.' });
  calls += 1;
  try {
    const response = await fetchImpl(GROQ_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `You are an expert personal fashion stylist.
Given any user search query, create a creative, specific, and stylish outfit recommendation tailored precisely to what they are looking for.
You MUST respond strictly in valid JSON format matching this exact schema:
{
  "category": "A fitting vibe or category name for this specific search",
  "title": "A catchy outfit title",
  "items": ["Item 1", "Item 2", "Item 3", "Footwear/Accessory"],
  "styling_tip": "Short, expert fashion styling advice for this look"
}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
      }),
    });

    const result = await response.json();

    if (result.error) {
      return res.status(502).json({ error: 'The fashion service is temporarily unavailable. Your wardrobe is still available.' });
    }

    const aiContent = JSON.parse(result.choices[0]?.message?.content || '{}');

    if (!response.ok || typeof aiContent.category !== 'string' || typeof aiContent.title !== 'string' || !Array.isArray(aiContent.items) || !aiContent.items.length || !aiContent.items.every((item) => typeof item === 'string') || typeof aiContent.styling_tip !== 'string') {
      return res.status(502).json({ error: 'The fashion service returned invalid outfit details.' });
    }
    // Preserve contributor response contract; never fabricate missing pieces.
    res.json({
      query,
      matched_category: aiContent.category,
      title: aiContent.title,
      items: aiContent.items,
      styling_tip: aiContent.styling_tip
    });

  } catch (err) {
    console.error('Fashion service request failed:', err.name);
    res.status(500).json({ error: 'Failed to connect to Groq API' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, configured: Boolean(GROQ_API_KEY) }));
return app;
}
module.exports = { createApp };
if (require.main === module) createApp().listen(Number(process.env.SEARCH_PORT || 5001), '0.0.0.0');
