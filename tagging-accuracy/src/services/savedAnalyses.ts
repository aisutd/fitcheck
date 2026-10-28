import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { BiasAnalysisResult, BiasImageInput, SavedBiasAnalysis } from '../types/bias';

const STORAGE_KEY = '@fitcheck/saved-bias-analyses/v1';
const MAX_SAVED_ANALYSES = 100;

function isSavedAnalysis(value: unknown): value is SavedBiasAnalysis {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedBiasAnalysis>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.imageUri === 'string' &&
    typeof candidate.savedAt === 'string' &&
    Boolean(candidate.result && typeof candidate.result === 'object')
  );
}

async function readSavedAnalyses(): Promise<SavedBiasAnalysis[]> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return [];

  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed.filter(isSavedAnalysis).slice(0, MAX_SAVED_ANALYSES) : [];
  } catch {
    return [];
  }
}

async function deleteNativeImage(imageUri: string) {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory || !imageUri.startsWith(FileSystem.documentDirectory)) return;
  await FileSystem.deleteAsync(imageUri, { idempotent: true });
}

async function createPersistentPreview(image: BiasImageInput, analysisId: string) {
  const preview = await manipulateAsync(
    image.uri,
    [{ resize: { width: 360 } }],
    { base64: Platform.OS === 'web', compress: 0.6, format: SaveFormat.JPEG },
  );

  if (Platform.OS === 'web') {
    if (!preview.base64) throw new Error('The saved preview could not be created.');
    return `data:image/jpeg;base64,${preview.base64}`;
  }

  if (!FileSystem.documentDirectory) throw new Error('Local image storage is unavailable.');
  const destination = `${FileSystem.documentDirectory}fitcheck-analysis-${analysisId}.jpg`;
  await FileSystem.copyAsync({ from: preview.uri, to: destination });
  return destination;
}

export async function loadSavedAnalyses() {
  return readSavedAnalyses();
}

export async function saveAnalysis(
  image: BiasImageInput,
  result: BiasAnalysisResult,
): Promise<SavedBiasAnalysis[]> {
  const imageUri = await createPersistentPreview(image, result.analysisId);
  const existing = await readSavedAnalyses();
  const duplicate = existing.find((item) => item.id === result.analysisId);
  if (duplicate) await deleteNativeImage(duplicate.imageUri);

  const nextItem: SavedBiasAnalysis = {
    id: result.analysisId,
    imageUri,
    fileName: image.fileName ?? 'Outfit photo',
    savedAt: result.analyzedAt,
    result,
  };
  const withoutDuplicate = existing.filter((item) => item.id !== result.analysisId);
  const overflow = withoutDuplicate.slice(MAX_SAVED_ANALYSES - 1);
  await Promise.all(overflow.map((item) => deleteNativeImage(item.imageUri)));

  const next = [nextItem, ...withoutDuplicate].slice(0, MAX_SAVED_ANALYSES);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    await deleteNativeImage(imageUri);
    throw error;
  }
  return next;
}

export async function removeSavedAnalysis(id: string): Promise<SavedBiasAnalysis[]> {
  const existing = await readSavedAnalyses();
  const target = existing.find((item) => item.id === id);
  if (target) await deleteNativeImage(target.imageUri);

  const next = existing.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

type RecognitionReviewUpdate = Partial<NonNullable<SavedBiasAnalysis['recognitionReview']>>;

export async function updateRecognitionReview(
  id: string,
  update: RecognitionReviewUpdate,
): Promise<SavedBiasAnalysis[]> {
  const existing = await readSavedAnalyses();
  const next = existing.map((item) => item.id === id
    ? {
      ...item,
      recognitionReview: {
        ...item.recognitionReview,
        ...update,
        reviewedAt: new Date().toISOString(),
      },
    }
    : item);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
