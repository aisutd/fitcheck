import { BiasAnalysisResult, BiasImageInput } from '../types/bias';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '');

function isAnalysisResult(value: unknown): value is BiasAnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BiasAnalysisResult>;
  return (
    typeof candidate.analysisId === 'string' &&
    typeof candidate.model === 'string' &&
    candidate.evidenceScope === 'single_image' &&
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
    if (!isAnalysisResult(payload)) throw new Error('The AI service returned an invalid response.');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

