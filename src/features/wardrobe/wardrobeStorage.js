import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  createEmptyWardrobeState,
  isWardrobeState,
  pruneExpiredItems,
} from './wardrobeModel';

const WARDROBE_KEY = '@fitcheck/wardrobe-v1';
const PHOTO_DIRECTORY_NAME = 'fitcheck-wardrobe';
let writeQueue = Promise.resolve();

function enqueueWrite(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

function getPhotoDirectory() {
  return new Directory(Paths.document, PHOTO_DIRECTORY_NAME);
}

function removeInternalPhoto(uri) {
  const directory = getPhotoDirectory();
  const prefix = directory.uri.endsWith('/') ? directory.uri : `${directory.uri}/`;
  if (!uri || !uri.startsWith(prefix)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

export async function loadWardrobeState() {
  const raw = await AsyncStorage.getItem(WARDROBE_KEY);
  if (raw === null) {
    return { state: createEmptyWardrobeState(), cleanupWarning: '' };
  }

  let state;
  try {
    state = JSON.parse(raw);
  } catch (error) {
    throw new Error('Saved wardrobe data could not be read as valid JSON.', { cause: error });
  }
  if (!isWardrobeState(state)) {
    throw new Error('Saved wardrobe data has an unsupported or invalid format.');
  }

  const { state: prunedState, expired } = pruneExpiredItems(state);
  let cleanupWarning = '';
  if (expired.length) {
    await saveWardrobeState(prunedState);
    const failures = [];
    for (const item of expired) {
      try {
        removeInternalPhoto(item.photoUri);
      } catch (error) {
        failures.push(error.message);
      }
    }
    if (failures.length) {
      cleanupWarning = `Expired clothing records were removed, but ${failures.length} stored photo file(s) could not be cleaned up.`;
    }
  }
  return { state: prunedState, cleanupWarning };
}

export function saveWardrobeState(state) {
  if (!isWardrobeState(state)) {
    return Promise.reject(new Error('The wardrobe data is invalid and was not saved.'));
  }
  return enqueueWrite(() => AsyncStorage.setItem(WARDROBE_KEY, JSON.stringify(state)));
}

export async function saveWardrobePhoto(sourceUri, fileId) {
  if (!sourceUri || typeof sourceUri !== 'string') {
    throw new Error('Choose a valid clothing photo before saving.');
  }
  const directory = getPhotoDirectory();
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });

  const context = ImageManipulator.ImageManipulator.manipulate(sourceUri);
  context.resize({ width: 1200, height: null });
  const image = await context.renderAsync();
  const processed = await image.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.82,
  });

  const destination = new File(directory, `${fileId}-${Date.now()}.jpg`);
  try {
    await new File(processed.uri).copy(destination);
  } finally {
    const temporary = new File(processed.uri);
    if (temporary.exists && processed.uri.startsWith(Paths.cache.uri)) {
      temporary.delete();
    }
  }
  return destination.uri;
}

export function deleteWardrobePhoto(uri) {
  return enqueueWrite(() => removeInternalPhoto(uri));
}

export function wardrobePhotoExists(uri) {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
