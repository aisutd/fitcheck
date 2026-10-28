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
  schemaVersion: number;
  analysisId: string;
  model: string;
  analyzedAt: string;
  evidenceScope: 'single_image';
  recognition: {
    garmentCategory: string;
    categoryConfidence: number;
    pattern: string;
    patternConfidence: number;
    patternExplanation: string;
    overallConfidence: number;
  };
  skinToneAssessment: {
    visibleToneBand: 'light' | 'medium' | 'deep' | 'unclear';
    riskScore: number | null;
    status: 'low_risk' | 'potential_concern' | 'insufficient_evidence';
    evidence: string[];
    explanation: string;
    recommendation: string;
  };
  bodyTypeAssessment: {
    visibleGroup: 'straight' | 'curvy' | 'athletic' | 'fuller' | 'unclear';
    confidence: number;
    explanation: string;
  };
  riskScore: number | null;
  scoreRationale: string | null;
  summary: string;
  scopeNote: string;
  findings: BiasFinding[];
  recommendations: string[];
};

export type SavedBiasAnalysis = {
  id: string;
  imageUri: string;
  fileName: string;
  savedAt: string;
  result: BiasAnalysisResult;
  recognitionReview?: {
    verdict?: 'correct' | 'incorrect';
    patternVerdict?: 'correct' | 'incorrect';
    skinToneGroup?: string;
    bodyTypeGroup?: string;
    reviewedAt: string;
  };
};

