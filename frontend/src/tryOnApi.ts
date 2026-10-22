import { Platform } from 'react-native';
import { Photo, validPhoto } from './photos';
export type TryOnInput = { userPhoto: Photo; garmentPhoto: Photo; garmentDescription?: string };
export type TryOnResult = { uri: string; requestId: string | null };

async function appendPhoto(form: FormData, field: string, photo: Photo, signal: AbortSignal) {
  const name = photo.fileName ?? `${field}.jpg`;
  const type = photo.mimeType ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = photo.file ?? await (await fetch(photo.uri, { signal })).blob();
    form.append(field, blob, name);
  } else {
    // React Native FormData accepts a local URI descriptor, unlike browser FormData.
    form.append(field, { uri: photo.uri, name, type } as unknown as Blob);
  }
}
function readImage(blob: Blob, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => { reader.abort(); reject(new Error('Processing was canceled.')); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    reader.onload = () => { cleanup(); if (typeof reader.result === 'string') resolve(reader.result); else reject(new Error('The generated image could not be read.')); };
    reader.onerror = () => { cleanup(); reject(new Error('The generated image could not be read.')); };
    reader.onabort = cleanup;
    if (signal.aborted) { reject(new Error('Processing was canceled.')); return; }
    signal.addEventListener('abort', abort, { once: true });
    reader.readAsDataURL(blob);
  });
}
export async function generateTryOn(input: TryOnInput, signal: AbortSignal): Promise<TryOnResult> {
  if (!validPhoto(input.userPhoto) || !validPhoto(input.garmentPhoto)) throw new Error('Two valid images are required.');
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new Error('Set EXPO_PUBLIC_API_URL to your backend address, then restart Expo.');
  const request = new AbortController();
  const cancel = () => request.abort();
  if (signal.aborted) request.abort();
  signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, 360_000);
  try {
    const form = new FormData();
    await appendPhoto(form, 'user_photo', input.userPhoto, request.signal);
    await appendPhoto(form, 'garment_photo', input.garmentPhoto, request.signal);
    if (input.garmentDescription) form.append('garment_description', input.garmentDescription);
    // Let fetch set the multipart boundary; do not supply Content-Type manually.
    const response = await fetch(`${baseUrl}/tryon`, { method: 'POST', body: form, signal: request.signal });
    if (!response.ok) {
      let message = `Try-on failed (${response.status}). Please try again.`;
      try { const error = await response.json(); if (typeof error.detail === 'string') message = error.detail; } catch { /* Proxy responses may be plain text. */ }
      throw new Error(message);
    }
    if (!response.headers.get('content-type')?.startsWith('image/png')) throw new Error('The backend returned an unexpected response.');
    const blob = await response.blob();
    if (!blob.size || blob.size > 16 * 1024 * 1024) throw new Error('The generated image is empty or too large.');
    return { uri: await readImage(blob, request.signal), requestId: response.headers.get('x-request-id') };
  } catch (error) {
    if (request.signal.aborted) throw new Error(signal.aborted ? 'Processing was canceled.' : 'Try-on timed out. The public demo may be busy.');
    if (error instanceof TypeError) throw new Error('Cannot reach the try-on backend. Check its address and that your phone and computer share a network.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
