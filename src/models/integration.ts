export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'layer' | 'accessory' | 'onepiece';
export type WeatherCondition = '' | 'cold' | 'mild' | 'hot' | 'rainy';
export interface RecognitionResult {
 category?: string; item?: string; color?: string; design?: string; material?: string; fit?: string;
 scores?: Record<string, number | null>;
 predictions?: Record<string, { value: unknown; score: number | null; source?: string }>;
 [key: string]: unknown;
}
export interface WardrobeItem {
 id: string; name: string; category: ClothingCategory; color: string; available: boolean; occasions: string[];
 photoUri?: string | null; createdAt?: string; material?: string; design?: string; brand?: string;
 fit?: string; timesWorn?: number; laundryStatus?: string; isFavorite?: boolean;
 recognition?: RecognitionResult; sourceCategory?: string;
 [key: string]: unknown;
}
export interface WardrobeState {
 schemaVersion: 1; mode: 'personal' | 'demo'; personalItems: WardrobeItem[];
 wishlistItems?: WardrobeItem[]; recentlyDeleted: (WardrobeItem & { deletedAt: string })[];
 demoAvailability: Record<string, boolean>;
}
// AI findings retain their original, versioned contract and confidence semantics.
export type { BiasAnalysisResult, SavedBiasAnalysis } from '../features/analysis/types/bias';
