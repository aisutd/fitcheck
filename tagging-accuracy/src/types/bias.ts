export type BiasImageInput = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type BiasFinding = {
  id: string;
  label: string;
  status: 'balanced' | 'watch';
  detail: string;
};

export type BiasAnalysisResult = {
  isDemo: boolean;
  fairnessScore: number;
  summary: string;
  findings: BiasFinding[];
  recommendations: string[];
};

