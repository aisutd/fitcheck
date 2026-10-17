const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: {
      type: 'string',
      description: 'A concise evidence-based summary that does not claim confirmed algorithmic bias.',
    },
    scopeNote: {
      type: 'string',
      description: 'Why a single image is limited evidence and what would be needed to test model bias.',
    },
    riskScore: {
      type: ['integer', 'null'],
      minimum: 0,
      maximum: 100,
      description: 'Optional rubric-based representational risk score. Null when evidence is insufficient.',
    },
    scoreRationale: {
      type: ['string', 'null'],
      description: 'Specific rubric mapping when riskScore is present; otherwise null.',
    },
    findings: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: {
            type: 'string',
            enum: [
              'clothing_recognition',
              'cultural_representation',
              'fashion_inclusivity',
              'stereotyping',
            ],
          },
          label: { type: 'string' },
          status: {
            type: 'string',
            enum: ['none_observed', 'potential_concern', 'insufficient_evidence'],
          },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          evidence: { type: 'array', items: { type: 'string' }, maxItems: 4 },
          explanation: { type: 'string' },
          recommendation: { type: 'string' },
        },
        required: [
          'category',
          'label',
          'status',
          'confidence',
          'evidence',
          'explanation',
          'recommendation',
        ],
      },
    },
    recommendations: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: { type: 'string' },
    },
  },
  required: ['summary', 'scopeNote', 'riskScore', 'scoreRationale', 'findings', 'recommendations'],
};

const analysisPrompt = `
You are assisting with a responsible fashion-AI evaluation. Analyze only what is visibly supported by
the uploaded outfit image. Do not identify the person and do not infer race, ethnicity, religion,
gender identity, health, disability, socioeconomic status, or other sensitive traits from appearance.

Evaluate exactly four categories:
1. Clothing recognition: observable garments, patterns, layers, and uncertainty.
2. Cultural representation: whether visible clothing has cultural context that a generic label might
   erase or stereotype. Use uncertainty and do not assign a culture to the wearer.
3. Fashion inclusivity: whether the image reveals potential fit, sizing, adaptive-fashion, modest-fashion,
   or styling coverage concerns. State insufficient evidence when it does not.
4. Stereotyping: any directly visible framing or clothing-description risk that could encourage a
   stereotyped interpretation. Do not invent intent.

This is a single-image content and representational-risk review. It cannot establish that an algorithm
is biased, cannot measure disparate performance, and cannot confirm demographic bias. Always explain
that limitation in scopeNote. Mark concerns as potential, not confirmed.

Numerical risk-score rubric:
- 0–24: direct evidence supports low representational risk.
- 25–49: one specific potential concern is visually supported, with plausible alternatives.
- 50–74: multiple specific signals across at least two categories are visually supported.
- 75–100: strong direct evidence of harmful or exclusionary framing across several categories.
Return riskScore as null unless the visible evidence supports a score and the rationale explicitly maps
that evidence to this rubric. Never manufacture evidence to produce a score. Return concise, practical
recommendations for improving evaluation coverage or labeling fairness.
`;

function validateAnalysis(value) {
  if (!value || typeof value !== 'object') throw new Error('Gemini returned an invalid response.');
  if (!Array.isArray(value.findings) || value.findings.length !== 4) {
    throw new Error('Gemini did not return all required evaluation categories.');
  }

  const categories = new Set(value.findings.map((finding) => finding.category));
  for (const required of [
    'clothing_recognition',
    'cultural_representation',
    'fashion_inclusivity',
    'stereotyping',
  ]) {
    if (!categories.has(required)) throw new Error(`Gemini omitted ${required}.`);
  }

  if (value.riskScore !== null) {
    if (!Number.isInteger(value.riskScore) || value.riskScore < 0 || value.riskScore > 100) {
      throw new Error('Gemini returned an invalid risk score.');
    }
    if (!value.scoreRationale) throw new Error('A scored response requires a rationale.');
  }

  return value;
}

export async function analyzeWithGemini({ apiKey, imageBuffer, mimeType, model }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: analysisPrompt },
            { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error('Gemini API error', upstream.status, detail.slice(0, 500));
    throw new Error(`Gemini request failed with status ${upstream.status}.`);
  }

  const payload = await upstream.json();
  const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
  if (!text) throw new Error('Gemini returned no analysis.');

  return validateAnalysis(JSON.parse(text));
}
