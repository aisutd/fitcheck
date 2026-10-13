import { Photo, validPhoto } from './photos';
export type TryOnInput = { userPhoto: Photo; garmentPhoto: Photo };
// Replace this adapter with an API request; original picker assets remain intact.
export async function simulateTryOn(input: TryOnInput, signal: AbortSignal) {
  if (!validPhoto(input.userPhoto) || !validPhoto(input.garmentPhoto)) throw new Error('Two valid images are required.');
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Aborted')); return; }
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new Error('Aborted')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 2600);
    signal.addEventListener('abort', abort, { once: true });
  });
  return { message: 'Your photos are ready! AI try-on is coming soon.' };
}
