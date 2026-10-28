import { BiasAnalysisResult, BiasImageInput } from '../types/bias';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '');

function isAnalysisResult(value: unknown): value is BiasAnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BiasAnalysisResult>;
  return (
    candidate.schemaVersion === 5 &&
    typeof candidate.analysisId === 'string' &&
    typeof candidate.model === 'string' &&
    candidate.evidenceScope === 'single_image' &&
    Boolean(
      candidate.recognition &&
      typeof candidate.recognition.garmentCategory === 'string' &&
      typeof candidate.recognition.categoryConfidence === 'number' &&
      typeof candidate.recognition.pattern === 'string' &&
      typeof candidate.recognition.patternConfidence === 'number' &&
      typeof candidate.recognition.patternExplanation === 'string' &&
      typeof candidate.recognition.overallConfidence === 'number'
    ) &&
    Boolean(
      candidate.skinToneAssessment &&
      typeof candidate.skinToneAssessment.visibleToneBand === 'string' &&
      (candidate.skinToneAssessment.riskScore === null || typeof candidate.skinToneAssessment.riskScore === 'number')
    ) &&
    Boolean(
      candidate.bodyTypeAssessment &&
      typeof candidate.bodyTypeAssessment.visibleGroup === 'string' &&
      typeof candidate.bodyTypeAssessment.confidence === 'number' &&
      typeof candidate.bodyTypeAssessment.explanation === 'string'
    ) &&
    typeof candidate.summary === 'string' &&
    typeof candidate.scopeNote === 'string' &&
    Array.isArray(candidate.findings) &&
    candidate.findings.length === 4 &&
    Array.isArray(candidate.recommendations)
  );
}

export async function analyzeBiasImage(image: BiasImageInput): Promise<BiasAnalysisResult> {
  const form = new FormData();
  const mimeType = image.mimeType ?? 'image/jpeg';
  const fileName = image.fileName ?? `fitcheck-upload.${mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'}`;

  if (typeof document !== 'undefined') {
    const imageResponse = await fetch(image.uri);
    if (!imageResponse.ok) throw new Error('The selected image could not be read.');
    form.append('image', await imageResponse.blob(), fileName);
  } else {
    form.append('image', { uri: image.uri, name: fileName, type: mimeType } as unknown as Blob);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65_000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/bias/analyze`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : 'The AI analysis could not be completed.';
      throw new Error(message);
    }
    if (!isAnalysisResult(payload)) {
      const version = payload && typeof payload === 'object' && 'schemaVersion' in payload
        ? String((payload as { schemaVersion: unknown }).schemaVersion)
        : 'missing';
      throw new Error(`The AI backend response is out of date (schema ${version}; expected 5). Restart the backend and try again.`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

