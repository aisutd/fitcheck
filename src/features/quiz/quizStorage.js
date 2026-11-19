import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  validateDraft,
  validateProfile,
} from './quizModel';

const DRAFT_KEY = '@fitcheck/quiz-draft-v1';
const PROFILE_KEY = '@fitcheck/style-profile-v1';

let writeQueue = Promise.resolve();

function enqueueWrite(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

function parseStoredValue(rawValue, validate, label) {
  if (rawValue === null) return null;

  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`The saved ${label} could not be read as valid data.`, { cause: error });
  }

  if (!validate(parsed)) {
    throw new Error(`The saved ${label} has an unsupported or invalid format.`);
  }
  return parsed;
}

export async function loadQuizState() {
  const [rawDraft, rawProfile] = await AsyncStorage.multiGet([DRAFT_KEY, PROFILE_KEY]);
  const values = new Map([rawDraft, rawProfile]);
  return {
    draft: parseStoredValue(
      values.get(DRAFT_KEY),
      validateDraft,
      'quiz draft',
    ),
    profile: parseStoredValue(
      values.get(PROFILE_KEY),
      validateProfile,
      'style profile',
    ),
  };
}

export function saveQuizDraft(draft) {
  if (!validateDraft(draft)) {
    return Promise.reject(new Error('The quiz draft is incomplete or invalid and was not saved.'));
  }
  return enqueueWrite(() => AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)));
}

export function saveStyleProfile(profile) {
  if (!validateProfile(profile)) {
    return Promise.reject(new Error('The style profile is incomplete or invalid and was not saved.'));
  }
  return enqueueWrite(() => AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)));
}

export function removeQuizDraft() {
  return enqueueWrite(() => AsyncStorage.removeItem(DRAFT_KEY));
}
