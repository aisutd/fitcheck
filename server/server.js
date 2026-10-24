const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(express.json());
app.use(cors());

// ==========================================
// Insert your Groq API Key below
// ==========================================
const GROQ_API_KEY = config.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fully open-ended AI Search Endpoint
app.post('/api/search-ai', async (req, res) => {
  const { query } = req.body;
  console.log('Incoming search query from app:', query);

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
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
      console.error('Groq API Error Response:', result.error);
      return res.status(500).json({ error: result.error.message });
    }

    const aiContent = JSON.parse(result.choices[0]?.message?.content || '{}');

    // Send back whatever the AI generated organically
    res.json({
      query,
      matched_category: aiContent.category || 'Custom Style',
      title: aiContent.title || 'Curated Look',
      items: aiContent.items || ['Styled Top', 'Matching Bottom', 'Footwear'],
      styling_tip: aiContent.styling_tip || 'Accessorize to match the occasion.'
    });

  } catch (err) {
    console.error('Catch Block Server Error:', err);
    res.status(500).json({ error: 'Failed to connect to Groq API' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});