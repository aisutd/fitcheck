import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_AVATAR_CUSTOMIZATION,
  isAvatarCustomization,
} from './avatarModel';

const AVATAR_KEY = '@fitcheck/avatar-customization-v1';
let writeQueue = Promise.resolve();

function enqueueWrite(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

export async function loadAvatarCustomization() {
  const raw = await AsyncStorage.getItem(AVATAR_KEY);
  if (raw === null) return { ...DEFAULT_AVATAR_CUSTOMIZATION };

  let customization;
  try {
    customization = JSON.parse(raw);
  } catch (error) {
    throw new Error('Saved avatar settings could not be read as valid JSON.', { cause: error });
  }

  if (!isAvatarCustomization(customization)) {
    throw new Error('Saved avatar settings have an unsupported or invalid format.');
  }
  return customization;
}

export function saveAvatarCustomization(customization) {
  if (!isAvatarCustomization(customization)) {
    return Promise.reject(new Error('Avatar settings are invalid and were not saved.'));
  }
  return enqueueWrite(() =>
    AsyncStorage.setItem(AVATAR_KEY, JSON.stringify(customization)),
  );
}
