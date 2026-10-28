const responseSchema = {
  type: 'object',
  properties: {
    recognition: {
      type: 'object',
      properties: {
        garmentCategory: {
          type: 'string',
          description: 'Concise main garment category visible in the image, or Unclear.',
        },
        categoryConfidence: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Visual confidence in the garment category based only on visible evidence.',
        },
        pattern: {
          type: 'string',
          description: 'Concise dominant garment pattern, such as Solid, Striped, Floral, or Unclear.',
        },
        patternConfidence: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Visual confidence in the pattern label based on garment visibility, lighting, scale, and occlusion.',
        },
        patternExplanation: {
          type: 'string',
          description: 'Short visual explanation for the pattern label and confidence score.',
        },
        overallConfidence: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Combined clothing-recognition confidence for this image, considering category and pattern evidence.',
        },
      },
      required: ['garmentCategory', 'categoryConfidence', 'pattern', 'patternConfidence', 'patternExplanation', 'overallConfidence'],
    },
    skinToneAssessment: {
      type: 'object',
      properties: {
        visibleToneBand: {
          type: 'string',
          enum: ['light', 'medium', 'deep', 'unclear'],
          description: 'Broad visible skin-tone band under the photo lighting; never a race or ethnicity label.',
        },
        riskScore: {
          type: 'integer',
          nullable: true,
          minimum: 0,
          maximum: 100,
          description: 'Single-image clothing-recognition risk related to lighting, contrast, or segmentation around visible skin. Null if evidence is insufficient.',
        },
        status: {
          type: 'string',
          enum: ['low_risk', 'potential_concern', 'insufficient_evidence'],
        },
        evidence: { type: 'array', items: { type: 'string' }, maxItems: 3 },
        explanation: { type: 'string' },
        recommendation: { type: 'string' },
      },
      required: ['visibleToneBand', 'riskScore', 'status', 'evidence', 'explanation', 'recommendation'],
    },
    bodyTypeAssessment: {
      type: 'object',
      properties: {
        visibleGroup: {
          type: 'string',
          enum: ['straight', 'curvy', 'athletic', 'fuller', 'unclear'],
          description: 'Broad image-only body-shape group supported by visible silhouette evidence, or unclear.',
        },
        confidence: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Visual confidence based on pose, framing, garment drape, and silhouette visibility.',
        },
        explanation: {
          type: 'string',
          description: 'Short neutral explanation of the visible evidence and uncertainty.',
        },
      },
      required: ['visibleGroup', 'confidence', 'explanation'],
    },
    summary: {
      type: 'string',
      description: 'A concise evidence-based summary that does not claim confirmed algorithmic bias.',
    },
    scopeNote: {
      type: 'string',
      description: 'Why a single image is limited evidence and what would be needed to test model bias.',
    },
    riskScore: {
      type: 'integer',
      nullable: true,
      minimum: 0,
      maximum: 100,
      description: 'Optional rubric-based representational risk score. Null when evidence is insufficient.',
    },
    scoreRationale: {
      type: 'string',
      nullable: true,
      description: 'Specific rubric mapping when riskScore is present; otherwise null.',
    },
    findings: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
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
  required: ['recognition', 'skinToneAssessment', 'bodyTypeAssessment', 'summary', 'scopeNote', 'riskScore', 'scoreRationale', 'findings', 'recommendations'],
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

Also return a recognition object with visually grounded garmentCategory and pattern predictions.
categoryConfidence is 0–100 visual confidence in the garment category. overallConfidence is a 0–100
combined recognition-confidence score for this image that weighs the category and pattern evidence.
These values are confidence estimates, not measured accuracy.
When a shirt or top is visible, identify its dominant pattern (for example Solid, Striped, Plaid,
Floral, Graphic, Textured, or Unclear). patternConfidence is 0–100 visual confidence—not measured
accuracy—and must reflect lighting, visible garment area, pattern scale, blur, and occlusion. Explain
the score briefly in patternExplanation. Use "Unclear" and a low confidence when the image does not
support a reliable label. Do not include demographic traits in these predictions.

Return a separate skinToneAssessment. A broad visibleToneBand describes only apparent skin tone under
the image lighting; it is not race or ethnicity. Evaluate whether lighting, contrast, occlusion, or
garment-to-skin boundaries create a potential clothing-recognition or segmentation risk in this image.
Use this score rubric:
- 0–24 low risk: skin and garment boundaries are clearly visible under usable lighting.
- 25–49 mild concern: one specific lighting or contrast limitation could affect recognition.
- 50–74 elevated concern: multiple visible limitations could affect garment boundary recognition.
- 75–100 high concern: severe visible lighting, occlusion, or contrast problems make boundaries unreliable.
Return a null skin-tone riskScore, visibleToneBand "unclear", and insufficient_evidence only when skin
is not visible enough to support the assessment. When a shirt or top and usable visible skin are both
present, provide the score and explicitly consider the shirt-to-skin boundary. Never treat this
single-image score as proof of bias.

Return a separate bodyTypeAssessment using only the visible silhouette in this image. Choose one broad
visual group: straight, curvy, athletic, fuller, or unclear. This is an image-only fashion-fit grouping,
not an identity, health, weight, or attractiveness judgment. Base confidence on pose, framing, garment
drape, layers, and how much of the silhouette is visible. Use unclear with low confidence when loose
clothing, cropping, pose, or occlusion makes the shape unreliable. Keep the explanation neutral and brief.

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

Writing rules for a simple, non-repetitive response:
- Use plain language and keep summary to one sentence of at most 22 words.
- Keep each finding explanation to one sentence of at most 18 words.
- Give at most one short, directly visible evidence point per category.
- Do not repeat the scope limitation outside scopeNote.
- Do not repeat an observation in summary, evidence, explanation, or recommendations.
- Make every recommendation a different, concrete action of at most 15 words.
- Return no more than three top-level recommendations.
`;

function validateAnalysis(value) {
  if (!value || typeof value !== 'object') throw new Error('Gemini returned an invalid response.');
  if (
    !value.recognition ||
    typeof value.recognition.garmentCategory !== 'string' ||
    !Number.isInteger(value.recognition.categoryConfidence) ||
    value.recognition.categoryConfidence < 0 ||
    value.recognition.categoryConfidence > 100 ||
    typeof value.recognition.pattern !== 'string' ||
    !Number.isInteger(value.recognition.patternConfidence) ||
    value.recognition.patternConfidence < 0 ||
    value.recognition.patternConfidence > 100 ||
    typeof value.recognition.patternExplanation !== 'string' ||
    !Number.isInteger(value.recognition.overallConfidence) ||
    value.recognition.overallConfidence < 0 ||
    value.recognition.overallConfidence > 100
  ) {
    throw new Error('Gemini did not return structured clothing recognition.');
  }
  if (
    !value.skinToneAssessment ||
    !['light', 'medium', 'deep', 'unclear'].includes(value.skinToneAssessment.visibleToneBand) ||
    !['low_risk', 'potential_concern', 'insufficient_evidence'].includes(value.skinToneAssessment.status)
  ) {
    throw new Error('Gemini did not return a valid skin-tone assessment.');
  }
  if (
    value.skinToneAssessment.riskScore !== null &&
    (!Number.isInteger(value.skinToneAssessment.riskScore) ||
      value.skinToneAssessment.riskScore < 0 ||
      value.skinToneAssessment.riskScore > 100)
  ) {
    throw new Error('Gemini returned an invalid skin-tone risk score.');
  }
  if (
    !value.bodyTypeAssessment ||
    !['straight', 'curvy', 'athletic', 'fuller', 'unclear'].includes(value.bodyTypeAssessment.visibleGroup) ||
    !Number.isInteger(value.bodyTypeAssessment.confidence) ||
    value.bodyTypeAssessment.confidence < 0 ||
    value.bodyTypeAssessment.confidence > 100 ||
    typeof value.bodyTypeAssessment.explanation !== 'string'
  ) {
    throw new Error('Gemini did not return a valid body-type assessment.');
  }
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
