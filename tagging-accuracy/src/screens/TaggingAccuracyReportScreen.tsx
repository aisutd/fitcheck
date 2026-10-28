import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccuracyInfoButton } from '../components/AccuracyInfoButton';
import { BiasDetectionCard } from '../components/BiasDetectionCard';
import { CircularAccuracy } from '../components/CircularAccuracy';
import { MetricRow } from '../components/MetricRow';
import { buildAccuracyReport } from '../services/accuracyReport';
import { colors } from '../theme';
import { AccuracyDimension, AccuracyReport } from '../types/accuracy';
import { SavedBiasAnalysis } from '../types/bias';

type TaggingAccuracyReportScreenProps = { report: AccuracyReport };

const dimensionSymbols: Record<AccuracyDimension['id'], string> = {
  categories: '◇', patterns: '≋', skinTones: '◐', bodyTypes: '⌁',
};

const emptyDimensionMessages: Record<AccuracyDimension['id'], string> = {
  categories: 'Analyze a photo, then confirm whether the predicted clothing category is correct.',
  patterns: 'Analyze a photo, then confirm whether the predicted garment pattern is correct.',
  skinTones: 'Analyze a new photo to generate a rubric-based skin-tone recognition-risk assessment.',
  bodyTypes: 'Confirm the clothing category and optionally select a device-only body-type evaluation group.',
};

export function TaggingAccuracyReportScreen({ report: baseReport }: TaggingAccuracyReportScreenProps) {
  const [selectedId, setSelectedId] = useState<AccuracyDimension['id']>('categories');
  const [analyses, setAnalyses] = useState<SavedBiasAnalysis[]>([]);
  const intro = useRef(new Animated.Value(0)).current;
  const report = useMemo(() => buildAccuracyReport(baseReport, analyses), [analyses, baseReport]);
  const selectedDimension = report.dimensions.find((dimension) => dimension.id === selectedId) ?? report.dimensions[0];
  const latestAnalysis = analyses[0];
  const latestDimension = useMemo(() => {
    if (!latestAnalysis) return null;
    const review = latestAnalysis.recognitionReview;
    if (selectedId === 'categories') {
      const confidence = latestAnalysis.result.recognition?.categoryConfidence;
      return {
        label: 'LATEST AI CATEGORY',
        value: confidence === undefined
          ? (latestAnalysis.result.recognition?.garmentCategory ?? 'Unclear')
          : `${latestAnalysis.result.recognition?.garmentCategory ?? 'Unclear'} · ${confidence}% confidence`,
        status: review?.verdict === 'correct' ? 'CONFIRMED' : review?.verdict === 'incorrect' ? 'FLAGGED' : 'AWAITING REVIEW',
      };
    }
    if (selectedId === 'patterns') {
      const confidence = latestAnalysis.result.recognition?.patternConfidence;
      return {
        label: 'LATEST SHIRT / GARMENT PATTERN',
        value: confidence === undefined
          ? (latestAnalysis.result.recognition?.pattern ?? 'Unclear')
          : `${latestAnalysis.result.recognition?.pattern ?? 'Unclear'} · ${confidence}% confidence`,
        detail: latestAnalysis.result.recognition?.patternExplanation,
        status: review?.patternVerdict === 'correct'
          ? 'CONFIRMED'
          : review?.patternVerdict === 'incorrect'
            ? 'FLAGGED'
            : confidence !== undefined && confidence < 50
              ? 'CHECK'
              : 'AI RATING',
      };
    }
    if (selectedId === 'skinTones') {
      const assessment = latestAnalysis.result.skinToneAssessment;
      const toneBand = assessment?.visibleToneBand && assessment.visibleToneBand !== 'unclear'
        ? `${assessment.visibleToneBand.charAt(0).toUpperCase()}${assessment.visibleToneBand.slice(1)} visible tone`
        : 'Visible tone unclear';
      return {
        label: `LATEST SKIN-TONE ASSESSMENT · ${toneBand.toUpperCase()}`,
        value: assessment?.riskScore === null || assessment?.riskScore === undefined
          ? 'Evidence limited'
          : `${assessment.riskScore}/100 risk`,
        detail: assessment?.explanation,
        status: assessment?.status === 'low_risk'
          ? 'LOW RISK'
          : assessment?.status === 'potential_concern'
            ? 'POTENTIAL'
            : 'LIMITED',
      };
    }
    const assessment = latestAnalysis.result.bodyTypeAssessment;
    const group = assessment?.visibleGroup && assessment.visibleGroup !== 'unclear'
      ? `${assessment.visibleGroup.charAt(0).toUpperCase()}${assessment.visibleGroup.slice(1)}`
      : 'Unclear from this image';
    return {
      label: 'LATEST IMAGE-ONLY BODY-TYPE RESULT',
      value: assessment ? `${group} · ${assessment.confidence}% confidence` : (review?.bodyTypeGroup ?? 'Unclear from this image'),
      detail: assessment?.explanation,
      status: review?.bodyTypeGroup
        ? 'USER CONFIRMED'
        : assessment && assessment.confidence >= 50 && assessment.visibleGroup !== 'unclear'
          ? 'AI RATING'
          : 'CHECK',
    };
  }, [latestAnalysis, selectedId]);
  const hasTests = analyses.length > 0 && report.overallAccuracy !== null;
  const lowPerformers = report.dimensions.flatMap((dimension) =>
    dimension.metrics.filter((metric) => metric.accuracy < report.lowAccuracyThreshold),
  );
  const weakest = [...lowPerformers].sort((a, b) => a.accuracy - b.accuracy)[0];

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  }, [intro]);

  if (!selectedDimension) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.ambientGlowOne} />
        <View style={styles.ambientGlowTwo} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <View style={styles.headerRow}>
              <View style={styles.wordmark}><Text style={styles.wordmarkMark}>F</Text></View>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>FITCHECK / AI AUDIT</Text>
                <Text style={styles.title}>Tagging intelligence</Text>
              </View>
              <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>REAL DATA</Text></View>
            </View>

            <LinearGradient colors={['#111126', '#191631', '#231B46']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.hero}>
              <View style={styles.heroOrbOne} /><View style={styles.heroOrbTwo} />
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroKicker}>OVERALL RECOGNITION CONFIDENCE</Text>
                <View style={styles.heroModelGroup}>
                  <Text style={styles.heroModel}>{report.modelName}</Text>
                  <Text style={styles.heroAudit}>{report.testedAt ? `AUDITED ${report.testedAt}` : 'NOT TESTED'}</Text>
                </View>
              </View>
              <CircularAccuracy value={report.overallAccuracy} />
              <View style={styles.heroMeta}>
                <View style={styles.metaItem}><Text style={styles.metaValue}>{report.overallAccuracy === null ? '—%' : `${report.overallAccuracy}%`}</Text><Text style={styles.metaLabel}>AI SCORE</Text></View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}><Text style={styles.metaValue}>{report.totalPhotos.toLocaleString()}</Text><Text style={styles.metaLabel}>TEST PHOTOS</Text></View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}><Text style={styles.metaValue}>{report.totalFlags.toLocaleString()}</Text><Text style={styles.metaLabel}>FLAGS FOUND</Text></View>
              </View>
            </LinearGradient>

            <LinearGradient colors={['#BBA8FF', '#8DE7FF', '#D5C8FF']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.insightBorder}>
              <View style={styles.insightCard}>
                <View style={styles.insightIcon}><Text style={styles.insightSpark}>✦</Text></View>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightEyebrow}>AI INSIGHT</Text>
                  <Text style={styles.insightTitle}>{hasTests ? (weakest ? `${weakest.label} needs a closer look` : `Average recognition confidence is ${report.overallAccuracy}%`) : 'No analyses completed'}</Text>
                  <Text style={styles.insightBody}>
                    {!hasTests
                      ? 'Analyze outfit photos to build an average recognition-confidence score. Human review is still required to measure accuracy.'
                      : weakest
                      ? `Recognition is ${weakest.accuracy}%—below the ${report.lowAccuracyThreshold}% fairness watch line. More varied training photos may help.`
                      : `Average confidence across ${report.totalPhotos.toLocaleString()} analyzed ${report.totalPhotos === 1 ? 'photo' : 'photos'}. Add human-reviewed labels before drawing conclusions about accuracy or demographic performance.`}
                  </Text>
                </View>
                <View style={styles.insightScore}><Text style={styles.insightScoreText}>{hasTests ? (weakest?.accuracy ?? '✓') : '—'}{hasTests && weakest ? '%' : ''}</Text></View>
              </View>
            </LinearGradient>

            <BiasDetectionCard onAnalysesChange={setAnalyses} />

            <View style={styles.exploreHeader}>
              <View><Text style={styles.sectionEyebrow}>EXPLORE THE SIGNAL</Text><Text style={styles.sectionTitle}>Accuracy by dimension</Text></View>
              <Text style={styles.swipeHint}>TAP TO SWITCH</Text>
            </View>

            <ScrollView contentContainerStyle={styles.dimensionRail} horizontal showsHorizontalScrollIndicator={false}>
              {report.dimensions.map((dimension) => {
                const selected = dimension.id === selectedId;
                return (
                  <Pressable
                    accessibilityRole="button" accessibilityState={{ selected }} key={dimension.id}
                    onPress={() => setSelectedId(dimension.id)}
                    style={({ pressed }) => [styles.dimensionButton, selected && styles.dimensionButtonSelected, pressed && styles.dimensionPressed]}
                  >
                    <Text style={[styles.dimensionSymbol, selected && styles.dimensionSymbolSelected]}>{dimensionSymbols[dimension.id]}</Text>
                    <Text style={[styles.dimensionLabel, selected && styles.dimensionLabelSelected]}>{dimension.title.replace('Clothing ', '')}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <LinearGradient colors={['#17152E', '#111126']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.signalPanel}>
              <View style={styles.signalPanelHeader}>
                <View>
                  <Text style={styles.signalTitle}>{selectedDimension.title}</Text>
                  <Text style={styles.signalDescription}>{selectedDimension.description}</Text>
                </View>
                <View style={styles.signalMark}><Text style={styles.signalMarkText}>{dimensionSymbols[selectedDimension.id]}</Text></View>
              </View>
              {latestDimension ? (
                <View style={styles.latestDimensionCard}>
                  <View style={styles.latestDimensionCopy}>
                    <Text style={styles.latestDimensionLabel}>{latestDimension.label}</Text>
                    <Text style={styles.latestDimensionValue}>{latestDimension.value}</Text>
                    {'detail' in latestDimension && latestDimension.detail
                      ? <Text style={styles.latestDimensionDetail}>{latestDimension.detail}</Text>
                      : null}
                  </View>
                  <View style={[
                    styles.latestDimensionPill,
                    (latestDimension.status === 'FLAGGED' || latestDimension.status === 'POTENTIAL' || latestDimension.status === 'CHECK') && styles.latestDimensionPillFlagged,
                  ]}>
                    <Text style={[
                      styles.latestDimensionStatus,
                      (latestDimension.status === 'FLAGGED' || latestDimension.status === 'POTENTIAL' || latestDimension.status === 'CHECK') && styles.latestDimensionStatusFlagged,
                    ]}>{latestDimension.status}</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.metrics} key={selectedDimension.id}>
                {selectedDimension.metrics.length > 0 ? selectedDimension.metrics.map((metric) => (
                  <MetricRow key={metric.id} lowAccuracyThreshold={report.lowAccuracyThreshold} metric={metric} />
                )) : (
                  <View style={styles.emptyMetrics}>
                    <Text style={styles.emptyMetricsTitle}>No tests completed</Text>
                    <Text style={styles.emptyMetricsBody}>{emptyDimensionMessages[selectedDimension.id]}</Text>
                  </View>
                )}
              </View>
              {selectedDimension.metrics.length > 0 ? <View style={styles.legend}>
                <View style={styles.legendItem}><View style={styles.goodLegendDot} /><Text style={styles.legendText}>On target</Text></View>
                <View style={styles.legendItem}><View style={styles.lowLegendDot} /><Text style={styles.legendText}>Below {report.lowAccuracyThreshold}% watch line</Text></View>
              </View> : null}
            </LinearGradient>

            <View style={styles.methodRow}>
              <Text style={styles.methodNumber}>01</Text><View style={styles.methodLine} />
              <View style={styles.methodCopy}>
                <Text style={styles.methodTitle}>Human-reviewed results</Text>
                <Text style={styles.methodBody}>AI score = the average overall recognition confidence across every analyzed image. Human-confirmed category results remain separate accuracy evidence.</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
        <AccuracyInfoButton lowAccuracyThreshold={report.lowAccuracyThreshold} totalPhotos={report.totalPhotos} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, overflow: 'hidden' },
  content: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 105 },
  ambientGlowOne: { position: 'absolute', top: -90, right: -110, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(176, 153, 255, 0.16)' },
  ambientGlowTwo: { position: 'absolute', top: 520, left: -100, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(141, 231, 255, 0.10)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  wordmark: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.midnight },
  wordmarkMark: { color: colors.surface, fontSize: 19, fontWeight: '900', fontStyle: 'italic' },
  headerCopy: { flex: 1, marginLeft: 11 },
  eyebrow: { color: colors.violet, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 3, color: colors.ink, fontSize: 21, fontWeight: '900', letterSpacing: -0.6 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#DDD5F3', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.62)', paddingHorizontal: 9, paddingVertical: 7 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.violet },
  liveText: { color: '#655B80', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  hero: { alignItems: 'center', overflow: 'hidden', borderRadius: 34, paddingHorizontal: 18, paddingTop: 19, paddingBottom: 18, shadowColor: colors.midnight, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 },
  heroOrbOne: { position: 'absolute', top: -55, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(128, 91, 255, 0.18)' },
  heroOrbTwo: { position: 'absolute', bottom: -75, left: -30, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(98, 222, 255, 0.08)' },
  heroLabelRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroKicker: { color: colors.electric, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  heroModelGroup: { maxWidth: 155, alignItems: 'flex-end' },
  heroModel: { maxWidth: 150, color: '#8C86A2', fontSize: 8, textAlign: 'right' },
  heroAudit: { marginTop: 3, color: '#68627F', fontSize: 6, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
  heroMeta: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 14 },
  metaItem: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  metaValue: { color: colors.surface, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  metaLabel: { marginTop: 3, color: '#79748F', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  metaDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },
  insightBorder: { marginTop: 14, borderRadius: 22, padding: 1 },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 21, backgroundColor: 'rgba(250,248,255,0.97)', padding: 14 },
  insightIcon: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.midnight },
  insightSpark: { color: colors.electric, fontSize: 19 },
  insightCopy: { flex: 1 },
  insightEyebrow: { color: colors.violet, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  insightTitle: { marginTop: 3, color: colors.ink, fontSize: 14, fontWeight: '900' },
  insightBody: { marginTop: 3, color: colors.muted, fontSize: 10, lineHeight: 14 },
  insightScore: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.amberSoft },
  insightScoreText: { color: colors.amber, fontSize: 13, fontWeight: '900' },
  exploreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25, paddingHorizontal: 2 },
  sectionEyebrow: { color: colors.violet, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  sectionTitle: { marginTop: 4, color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  swipeHint: { marginBottom: 3, color: '#958EA8', fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  dimensionRail: { gap: 8, paddingVertical: 13, paddingRight: 12 },
  dimensionButton: { minWidth: 95, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#E1DCEF', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.72)', paddingHorizontal: 12, paddingVertical: 10 },
  dimensionButtonSelected: { borderColor: colors.midnight, backgroundColor: colors.midnight },
  dimensionPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  dimensionSymbol: { color: colors.violet, fontSize: 15, fontWeight: '800' },
  dimensionSymbolSelected: { color: colors.electric },
  dimensionLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  dimensionLabelSelected: { color: colors.surface },
  signalPanel: { borderRadius: 27, padding: 16, overflow: 'hidden' },
  signalPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 7, paddingBottom: 8 },
  signalTitle: { color: colors.surface, fontSize: 17, fontWeight: '900' },
  signalDescription: { maxWidth: 255, marginTop: 4, color: '#858096', fontSize: 10, lineHeight: 14 },
  signalMark: { width: 37, height: 37, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#373252', borderRadius: 13, backgroundColor: '#201D3B' },
  signalMarkText: { color: colors.electric, fontSize: 17 },
  latestDimensionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginHorizontal: 1, marginTop: 5, marginBottom: 9, borderWidth: 1, borderColor: 'rgba(141,231,255,0.16)', borderRadius: 15, backgroundColor: 'rgba(141,231,255,0.06)', paddingHorizontal: 12, paddingVertical: 11 },
  latestDimensionCopy: { flex: 1 },
  latestDimensionLabel: { color: '#817B96', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  latestDimensionValue: { marginTop: 4, color: colors.surface, fontSize: 13, fontWeight: '900' },
  latestDimensionDetail: { marginTop: 5, color: '#928CA4', fontSize: 8, lineHeight: 12 },
  latestDimensionPill: { borderRadius: 999, backgroundColor: 'rgba(141,231,255,0.12)', paddingHorizontal: 8, paddingVertical: 6 },
  latestDimensionPillFlagged: { backgroundColor: 'rgba(255,145,112,0.14)' },
  latestDimensionStatus: { color: colors.electric, fontSize: 6, fontWeight: '900', letterSpacing: 0.5 },
  latestDimensionStatusFlagged: { color: colors.amber },
  metrics: { marginTop: 3 },
  emptyMetrics: { alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#302B4B', borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.035)', paddingHorizontal: 20, paddingVertical: 24 },
  emptyMetricsTitle: { color: colors.surface, fontSize: 13, fontWeight: '900' },
  emptyMetricsBody: { marginTop: 5, color: '#858096', fontSize: 9, lineHeight: 14, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', marginTop: 4, paddingHorizontal: 8, paddingTop: 13 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goodLegendDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.electric },
  lowLegendDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.amber },
  legendText: { color: '#77718F', fontSize: 8, fontWeight: '700' },
  methodRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 22, paddingHorizontal: 5 },
  methodNumber: { color: colors.violet, fontSize: 10, fontWeight: '900' },
  methodLine: { width: 34, height: 1, marginHorizontal: 9, marginTop: 7, backgroundColor: colors.lavender },
  methodCopy: { flex: 1 },
  methodTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  methodBody: { marginTop: 4, color: colors.muted, fontSize: 10, lineHeight: 15 },
});
