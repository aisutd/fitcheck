import { importLegacyCollections } from './legacyCollections';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { createEmptyWardrobeState, isWardrobeState, pruneExpiredItems } from './wardrobeModel';
const KEY = '@fitcheck/wardrobe-v1';
let writes = Promise.resolve();
export async function loadWardrobeState() {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) {
    const state = await importLegacyCollections(createEmptyWardrobeState());
    if (state.personalItems.length || state.wishlistItems.length) await saveWardrobeState(state);
    return { state, cleanupWarning: '' };
  }
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('Saved wardrobe data could not be read as valid JSON.'); }
  if (!isWardrobeState(state)) throw new Error('Saved wardrobe data has an unsupported or invalid format.');
  const { state: pruned, expired } = pruneExpiredItems(state);
  if (expired.length) await saveWardrobeState(pruned);
  return { state: pruned, cleanupWarning: '' };
}
export function saveWardrobeState(state) {
  if (!isWardrobeState(state)) return Promise.reject(new Error('The wardrobe data is invalid and was not saved.'));
  const next = writes.then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)));
  writes = next.catch(() => {}); return next;
}
export async function saveWardrobePhoto(sourceUri) {
  const context = ImageManipulator.manipulate(sourceUri);
  context.resize({ width: 900, height: null });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true });
  if (!result.base64 || result.base64.length > 1500000) throw new Error('The clothing photo could not be saved.');
  return `data:image/jpeg;base64,${result.base64}`;
}
export async function deleteWardrobePhoto() { /* Browser photos are owned by their stored record. */ }
export function wardrobePhotoExists(uri) { return typeof uri === 'string' && /^(data:image\/|https?:\/\/|public-photo:)/.test(uri); }
