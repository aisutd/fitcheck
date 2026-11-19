import { AccuracyMetric, AccuracyReport } from '../types/accuracy';
import { SavedBiasAnalysis } from '../types/bias';

type Verdict = 'correct' | 'incorrect' | undefined;

function metricId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'unlabeled';
}

function skinToneLabel(item: SavedBiasAnalysis) {
  const band = item.result.skinToneAssessment?.visibleToneBand;
  if (!band || band === 'unclear') return undefined;
  return `${band.charAt(0).toUpperCase()}${band.slice(1)} visible tone`;
}

function bodyTypeLabel(item: SavedBiasAnalysis) {
  const group = item.result.bodyTypeAssessment?.visibleGroup;
  if (!group || group === 'unclear') return undefined;
  return `${group.charAt(0).toUpperCase()}${group.slice(1)} visual group`;
}

function aggregateMetrics(
  analyses: SavedBiasAnalysis[],
  labelFor: (item: SavedBiasAnalysis) => string | undefined,
  verdictFor: (item: SavedBiasAnalysis) => Verdict,
): AccuracyMetric[] {
  const groups = new Map<string, { correct: number; total: number }>();

  analyses.forEach((item) => {
    const label = labelFor(item)?.trim();
    const verdict = verdictFor(item);
    if (!label || !verdict) return;
    const group = groups.get(label) ?? { correct: 0, total: 0 };
    group.total += 1;
    if (verdict === 'correct') group.correct += 1;
    groups.set(label, group);
  });

  return [...groups.entries()]
    .map(([label, group]) => ({
      id: metricId(label),
      label,
      accuracy: Math.round((group.correct / group.total) * 100),
      sampleCount: group.total,
    }))
    .sort((a, b) => b.sampleCount - a.sampleCount || a.label.localeCompare(b.label));
}

function aggregateConfidenceMetrics(
  analyses: SavedBiasAnalysis[],
  labelFor: (item: SavedBiasAnalysis) => string | undefined,
  confidenceFor: (item: SavedBiasAnalysis) => number | undefined,
): AccuracyMetric[] {
  const groups = new Map<string, { confidenceTotal: number; total: number }>();

  analyses.forEach((item) => {
    const label = labelFor(item)?.trim();
    const confidence = confidenceFor(item);
    if (!label || confidence === undefined || !Number.isFinite(confidence)) return;
    const group = groups.get(label) ?? { confidenceTotal: 0, total: 0 };
    group.confidenceTotal += Math.max(0, Math.min(100, confidence));
    group.total += 1;
    groups.set(label, group);
  });

  return [...groups.entries()]
    .map(([label, group]) => ({
      id: metricId(label),
      label,
      accuracy: Math.round(group.confidenceTotal / group.total),
      sampleCount: group.total,
    }))
    .sort((a, b) => b.sampleCount - a.sampleCount || a.label.localeCompare(b.label));
}

export function buildAccuracyReport(
  baseReport: AccuracyReport,
  analyses: SavedBiasAnalysis[],
): AccuracyReport {
  const newestActivity = analyses.reduce((latest, item) => {
    const activityAt = item.recognitionReview?.reviewedAt ?? item.savedAt;
    return activityAt > latest ? activityAt : latest;
  }, '');
  const recognitionScores = analyses
    .map((item) => item.result.recognition?.overallConfidence ?? item.result.recognition?.patternConfidence)
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
  const averageRecognitionScore = recognitionScores.length > 0
    ? Math.round(recognitionScores.reduce((sum, score) => sum + score, 0) / recognitionScores.length)
    : null;

  const generatedMetrics = {
    categories: aggregateMetrics(
      analyses,
      (item) => item.result.recognition?.garmentCategory ?? 'Unlabeled garment',
      (item) => item.recognitionReview?.verdict,
    ),
    patterns: aggregateConfidenceMetrics(
      analyses,
      (item) => item.result.recognition?.pattern ?? 'Unlabeled pattern',
      (item) => item.result.recognition?.patternConfidence,
    ),
    skinTones: aggregateMetrics(
      analyses,
      skinToneLabel,
      (item) => item.recognitionReview?.verdict,
    ),
    bodyTypes: aggregateConfidenceMetrics(
      analyses,
      bodyTypeLabel,
      (item) => item.result.bodyTypeAssessment?.confidence,
    ),
  };

  return {
    ...baseReport,
    modelName: analyses[0]?.result.model ?? baseReport.modelName,
    testedAt: newestActivity ? new Date(newestActivity).toLocaleDateString() : baseReport.testedAt,
    overallAccuracy: averageRecognitionScore ?? baseReport.overallAccuracy,
    totalPhotos: analyses.length || baseReport.totalPhotos,
    totalFlags: analyses.length > 0
      ? analyses.reduce(
        (count, item) => count + item.result.findings.filter((finding) => finding.status === 'potential_concern').length,
        0,
      )
      : baseReport.totalFlags,
    dimensions: baseReport.dimensions.map((dimension) => ({
      ...dimension,
      metrics: generatedMetrics[dimension.id].length > 0
        ? generatedMetrics[dimension.id]
        : dimension.metrics,
    })),
  };
}
