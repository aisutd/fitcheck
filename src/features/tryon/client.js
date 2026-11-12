import { Platform } from 'react-native';
const API = (process.env.EXPO_PUBLIC_TRYON_API_URL || 'http://localhost:8001').replace(/\/$/, '');
export async function generateTryOn(person, garment, signal) {
  const data = new FormData();
  for (const [name, photo] of [['person', person], ['garment', garment]]) {
    if (!photo?.uri) throw new Error('Choose both a person and a garment photo.');
    if (Platform.OS === 'web') {
      const response = await fetch(photo.uri, { signal });
      if (!response.ok) throw new Error('The selected photo could not be read.');
      data.append(name, await response.blob(), photo.fileName || `${name}.jpg`);
    } else data.append(name, { uri: photo.uri, name: photo.fileName || `${name}.jpg`, type: photo.mimeType || 'image/jpeg' });
  }
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const cleanup = () => signal?.removeEventListener('abort', abort);
    request.open('POST', `${API}/tryon`); request.timeout = 610000; request.responseType = 'blob';
    request.onload = () => {
      cleanup();
      const blob = request.response;
      const reader = new FileReader();
      if (request.status < 200 || request.status >= 300) {
        reader.onload = () => {
          let message = `Try-on failed (${request.status}).`;
          try { message = JSON.parse(String(reader.result)).detail || message; } catch { /* Use status if server returns non-JSON. */ }
          reject(new Error(message));
        };
        reader.onerror = () => reject(new Error('Try-on failed. Check the service configuration.'));
        reader.readAsText(blob); return;
      }
      if (!blob?.type?.startsWith('image/')) { reject(new Error('Try-on did not return an image.')); return; }
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('The generated image could not be read.'));
      reader.readAsDataURL(blob);
    };
    request.onerror = () => { cleanup(); reject(new Error('Cannot reach the try-on service.')); };
    request.ontimeout = () => { cleanup(); reject(new Error('Try-on timed out. Please try again.')); };
    request.onabort = () => { cleanup(); reject(new Error('Try-on canceled.')); };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { cleanup(); reject(new Error('Try-on canceled.')); return; }
    request.send(data);
  });
}
