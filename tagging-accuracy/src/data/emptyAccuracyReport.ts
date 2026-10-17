import { AccuracyReport } from '../types/accuracy';

/**
 * Honest initial state. Aggregate accuracy requires predictions matched against
 * human-reviewed ground truth; individual image analyses are not accuracy tests.
 */
export const emptyAccuracyReport: AccuracyReport = {
  modelName: 'Gemini 3.8 Flash',
  testedAt: null,
  overallAccuracy: null,
  totalPhotos: 0,
  lowAccuracyThreshold: 75,
  dimensions: [
    {
      id: 'categories',
      title: 'Clothing categories',
      description: 'How often the main garment type was identified correctly.',
      metrics: [],
    },
    {
      id: 'patterns',
      title: 'Patterns',
      description: 'Performance when detecting the garment’s dominant pattern.',
      metrics: [],
    },
    {
      id: 'skinTones',
      title: 'Skin tones',
      description: 'Recognition accuracy across skin-tone groups in a labeled test set.',
      metrics: [],
    },
    {
      id: 'bodyTypes',
      title: 'Body types',
      description: 'Recognition accuracy across body-shape groups in a labeled test set.',
      metrics: [],
    },
  ],
};
