import { AccuracyReport } from '../types/accuracy';

/**
 * Demonstration-only values. Replace this object with a response from the
 * recognition evaluation API; the screen accepts any AccuracyReport object.
 */
export const demoAccuracyReport: AccuracyReport = {
  isDemo: true,
  modelName: 'FitCheck Vision · demo model',
  testedAt: 'October 10, 2026',
  overallAccuracy: 87,
  totalPhotos: 1240,
  lowAccuracyThreshold: 75,
  dimensions: [
    {
      id: 'categories',
      title: 'Clothing categories',
      description: 'How often the main garment type was identified correctly.',
      metrics: [
        { id: 'tops', label: 'Tops', accuracy: 94, sampleCount: 282 },
        { id: 'bottoms', label: 'Bottoms', accuracy: 91, sampleCount: 238 },
        { id: 'dresses', label: 'Dresses', accuracy: 88, sampleCount: 196 },
        { id: 'shoes', label: 'Shoes', accuracy: 84, sampleCount: 271 },
        { id: 'outerwear', label: 'Outerwear', accuracy: 72, sampleCount: 153 },
        { id: 'accessories', label: 'Accessories', accuracy: 68, sampleCount: 100 },
      ],
    },
    {
      id: 'patterns',
      title: 'Patterns',
      description: 'Performance when detecting the garment’s dominant pattern.',
      metrics: [
        { id: 'solid', label: 'Solid', accuracy: 95, sampleCount: 448 },
        { id: 'striped', label: 'Striped', accuracy: 86, sampleCount: 225 },
        { id: 'floral', label: 'Floral', accuracy: 82, sampleCount: 184 },
        { id: 'plaid', label: 'Plaid', accuracy: 79, sampleCount: 169 },
        { id: 'abstract', label: 'Abstract', accuracy: 70, sampleCount: 214 },
      ],
    },
    {
      id: 'skinTones',
      title: 'Skin tones',
      description: 'Recognition accuracy across the skin-tone groups in the test set.',
      metrics: [
        { id: 'light', label: 'Light', accuracy: 91, sampleCount: 302 },
        { id: 'medium-light', label: 'Medium-light', accuracy: 89, sampleCount: 317 },
        { id: 'medium-dark', label: 'Medium-dark', accuracy: 84, sampleCount: 311 },
        { id: 'dark', label: 'Dark', accuracy: 76, sampleCount: 310 },
      ],
    },
    {
      id: 'bodyTypes',
      title: 'Body types',
      description: 'Recognition accuracy across body-shape groups represented in testing.',
      metrics: [
        { id: 'straight', label: 'Straight', accuracy: 91, sampleCount: 306 },
        { id: 'hourglass', label: 'Hourglass', accuracy: 88, sampleCount: 309 },
        { id: 'pear', label: 'Pear', accuracy: 83, sampleCount: 314 },
        { id: 'round', label: 'Round', accuracy: 73, sampleCount: 311 },
      ],
    },
  ],
};
