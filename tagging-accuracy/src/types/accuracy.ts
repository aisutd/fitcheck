export type AccuracyMetric = {
  id: string;
  label: string;
  accuracy: number;
  sampleCount: number;
};

export type AccuracyDimension = {
  id: 'categories' | 'patterns' | 'skinTones' | 'bodyTypes';
  title: string;
  description: string;
  metrics: AccuracyMetric[];
};

export type AccuracyReport = {
  modelName: string;
  testedAt: string | null;
  overallAccuracy: number | null;
  totalPhotos: number;
  lowAccuracyThreshold: number;
  dimensions: AccuracyDimension[];
};
