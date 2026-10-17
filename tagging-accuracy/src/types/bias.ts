export type BiasImageInput = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type BiasFinding = {
  category: 'clothing_recognition' | 'cultural_representation' | 'fashion_inclusivity' | 'stereotyping';
  label: string;
  status: 'none_observed' | 'potential_concern' | 'insufficient_evidence';
  confidence: 'low' | 'medium' | 'high';
  evidence: string[];
  explanation: string;
  recommendation: string;
};

export type BiasAnalysisResult = {
  analysisId: string;
  model: string;
  analyzedAt: string;
  evidenceScope: 'single_image';
  riskScore: number | null;
  scoreRationale: string | null;
  summary: string;
  scopeNote: string;
  findings: BiasFinding[];
  recommendations: string[];
};

