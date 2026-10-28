import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { analyzeBiasImage } from '../services/biasAnalysis';
import {
  loadSavedAnalyses,
  removeSavedAnalysis,
  saveAnalysis,
  updateRecognitionReview,
} from '../services/savedAnalyses';
import { colors } from '../theme';
import { BiasAnalysisResult, BiasImageInput, SavedBiasAnalysis } from '../types/bias';

const acceptedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const acceptedExtensions = /\.(jpe?g|png|webp)$/i;
const bodyTypeGroups = ['Straight', 'Curvy', 'Athletic', 'Fuller'];

function uniqueRecommendations(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

type BiasDetectionCardProps = {
  onAnalysesChange?: (analyses: SavedBiasAnalysis[]) => void;
};

export function BiasDetectionCard({ onAnalysesChange }: BiasDetectionCardProps) {
  const [image, setImage] = useState<BiasImageInput | null>(null);
  const [result, setResult] = useState<BiasAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedBiasAnalysis[]>([]);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const currentSaved = result ? savedAnalyses.find((item) => item.id === result.analysisId) : undefined;

  useEffect(() => {
    let active = true;
    loadSavedAnalyses()
      .then((items) => { if (active) setSavedAnalyses(items); })
      .catch(() => { if (active) setStorageMessage('Saved analyses could not be loaded.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    onAnalysesChange?.(savedAnalyses);
  }, [onAnalysesChange, savedAnalyses]);

  const pickImage = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is needed to select an outfit image.');
      return;
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.9,
    });

    if (selection.canceled || !selection.assets[0]) return;
    const asset = selection.assets[0];
    const supported = asset.mimeType
      ? acceptedMimeTypes.has(asset.mimeType.toLowerCase())
      : acceptedExtensions.test(asset.fileName ?? asset.uri);

    if (!supported) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }

    setImage({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    setResult(null);
    setStorageMessage(null);
    reveal.setValue(0);
  };

  const runAnalysis = async () => {
    if (!image || isAnalyzing) return;
    setError(null);
    setIsAnalyzing(true);
    setResult(null);
    reveal.setValue(0);

    try {
      const nextResult = await analyzeBiasImage(image);
      setResult(nextResult);
      try {
        setSavedAnalyses(await saveAnalysis(image, nextResult));
        setStorageMessage('Saved privately on this device.');
      } catch {
        setStorageMessage('Analysis finished, but its image could not be saved locally.');
      }
      Animated.spring(reveal, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'The analysis could not be completed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openSavedAnalysis = (saved: SavedBiasAnalysis) => {
    setImage({ uri: saved.imageUri, fileName: saved.fileName, mimeType: 'image/jpeg' });
    setResult(saved.result);
    setError(null);
    setStorageMessage('Viewing a saved analysis.');
    reveal.setValue(1);
  };

  const saveRecognitionReview = async (
    update: Parameters<typeof updateRecognitionReview>[1],
    message: string,
  ) => {
    if (!result || !currentSaved) return;
    try {
      setSavedAnalyses(await updateRecognitionReview(result.analysisId, update));
      setStorageMessage(message);
    } catch {
      setStorageMessage('Your recognition review could not be saved.');
    }
  };

  const confirmRemoveSavedAnalysis = (saved: SavedBiasAnalysis) => {
    Alert.alert(
      'Remove saved analysis?',
      'This removes the locally stored image and its AI findings from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSavedAnalysis(saved.id)
              .then((items) => {
                setSavedAnalyses(items);
                if (result?.analysisId === saved.id) {
                  setResult(null);
                  setImage(null);
                  reveal.setValue(0);
                }
                setStorageMessage('Saved image and analysis deleted from this device.');
              })
              .catch(() => setStorageMessage('The saved analysis could not be removed.'));
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>PERSONAL FAIRNESS CHECK</Text>
          <Text style={styles.title}>Analyze your fit</Text>
        </View>
        <View style={styles.aiPill}><Text style={styles.aiPillText}>AI BIAS</Text></View>
      </View>

      <LinearGradient
        colors={['#1A1735', '#111126', '#211946']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.card}
      >
        <View style={styles.orb} />
        <Pressable
          accessibilityLabel={image ? 'Change outfit image' : 'Upload outfit image'}
          accessibilityRole="button"
          onPress={pickImage}
          style={({ pressed }) => [styles.uploadArea, pressed && styles.pressed]}
        >
          {image ? (
            <>
              <Image source={{ uri: image.uri }} style={styles.preview} />
              <LinearGradient colors={['transparent', 'rgba(10,9,27,0.92)']} style={styles.previewShade} />
              <View style={styles.changePill}><Text style={styles.changeText}>CHANGE PHOTO</Text></View>
              <View style={styles.fileCopy}>
                <Text numberOfLines={1} style={styles.fileName}>{image.fileName ?? 'Selected outfit'}</Text>
                <Text style={styles.fileMeta}>READY FOR FAIRNESS ANALYSIS</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.uploadIcon}><Text style={styles.uploadIconText}>↥</Text></View>
              <Text style={styles.uploadTitle}>Add an outfit photo</Text>
              <Text style={styles.uploadBody}>Choose a clear photo of a person wearing an outfit.</Text>
              <View style={styles.formatPill}><Text style={styles.formatText}>JPG  ·  PNG  ·  WEBP</Text></View>
            </View>
          )}
        </Pressable>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !image || isAnalyzing, busy: isAnalyzing }}
          disabled={!image || isAnalyzing}
          onPress={runAnalysis}
          style={({ pressed }) => [styles.buttonShell, (!image || isAnalyzing) && styles.buttonDisabled, pressed && styles.pressed]}
        >
          <LinearGradient colors={['#8B5CF6', '#A96DFF', '#7ADDF7']} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.button}>
            {isAnalyzing ? <ActivityIndicator color={colors.surface} size="small" /> : <Text style={styles.buttonSpark}>✦</Text>}
            <Text style={styles.buttonText}>{isAnalyzing ? 'Analyzing fairness…' : 'Analyze Bias'}</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.privacyNote}>
          The photo is sent to the configured AI service for analysis. Upload only images you have permission to use.
        </Text>

        {result ? (
          <Animated.View
            style={[
              styles.result,
              { opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
            ]}
          >
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultEyebrow}>AI FEEDBACK · {result.model}</Text>
                <Text style={styles.resultTitle}>Fairness signal</Text>
              </View>
              <View style={styles.score}>
                <Text style={result.riskScore === null ? styles.unscoredValue : styles.scoreValue}>
                  {result.riskScore === null ? 'Not scored' : result.riskScore}
                </Text>
                {result.riskScore === null ? null : <Text style={styles.scoreUnit}>/100 risk</Text>}
              </View>
            </View>
            <Text style={styles.summary}>{result.summary}</Text>
            <View style={styles.scopeNoteBox}>
              <Text style={styles.scopeNoteLabel}>SINGLE-IMAGE CHECK</Text>
              <Text style={styles.scopeNote}>{result.scopeNote}</Text>
            </View>

            <View style={styles.recognitionReview}>
              <Text style={styles.recognitionReviewEyebrow}>BUILD THE ACCURACY REPORT</Text>
              <Text style={styles.recognitionReviewText}>Confirm the AI predictions. These answers—not AI confidence—create the accuracy percentages.</Text>

              <View style={styles.predictionRow}>
                <Text style={styles.predictionKind}>CLOTHING CATEGORY</Text>
                <Text style={styles.predictionValue}>{result.recognition?.garmentCategory ?? 'Unclear'}</Text>
              </View>
              <Text style={styles.recognitionReviewQuestion}>Is this category correct?</Text>
              <View style={styles.recognitionReviewActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentSaved?.recognitionReview?.verdict === 'correct', disabled: !currentSaved }}
                  disabled={!currentSaved}
                  onPress={() => saveRecognitionReview(
                    { verdict: 'correct' },
                    'Category confirmed and included in Overall Recognition.',
                  )}
                  style={({ pressed }) => [
                    styles.reviewButton,
                    currentSaved?.recognitionReview?.verdict === 'correct' && styles.reviewButtonCorrect,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.reviewButtonText}>✓ Looks accurate</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentSaved?.recognitionReview?.verdict === 'incorrect', disabled: !currentSaved }}
                  disabled={!currentSaved}
                  onPress={() => saveRecognitionReview(
                    { verdict: 'incorrect' },
                    'Category flagged as incorrect and included in Overall Recognition.',
                  )}
                  style={({ pressed }) => [
                    styles.reviewButton,
                    currentSaved?.recognitionReview?.verdict === 'incorrect' && styles.reviewButtonIncorrect,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.reviewButtonText}>! Needs correction</Text>
                </Pressable>
              </View>

              <View style={styles.predictionRow}>
                <Text style={styles.predictionKind}>PATTERN</Text>
                <Text style={styles.predictionValue}>
                  {result.recognition?.pattern ?? 'Unclear'}
                  {result.recognition?.patternConfidence === undefined ? '' : ` · ${result.recognition.patternConfidence}%`}
                </Text>
              </View>
              {result.recognition?.patternExplanation
                ? <Text style={styles.predictionExplanation}>{result.recognition.patternExplanation}</Text>
                : null}
              <Text style={styles.recognitionReviewQuestion}>Is this pattern correct?</Text>
              <View style={styles.recognitionReviewActions}>
                {(['correct', 'incorrect'] as const).map((verdict) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: currentSaved?.recognitionReview?.patternVerdict === verdict, disabled: !currentSaved }}
                    disabled={!currentSaved}
                    key={verdict}
                    onPress={() => saveRecognitionReview(
                      { patternVerdict: verdict },
                      'Pattern review saved and added to the Patterns tab.',
                    )}
                    style={({ pressed }) => [
                      styles.reviewButton,
                      currentSaved?.recognitionReview?.patternVerdict === verdict && (verdict === 'correct' ? styles.reviewButtonCorrect : styles.reviewButtonIncorrect),
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.reviewButtonText}>{verdict === 'correct' ? '✓ Looks accurate' : '! Needs correction'}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.contextTitle}>SKIN-TONE BIAS RISK</Text>
              <View style={styles.skinToneAssessment}>
                <View style={styles.skinToneScoreRow}>
                  <View>
                    <Text style={styles.skinToneBand}>
                      {result.skinToneAssessment?.visibleToneBand === 'unclear'
                        ? 'VISIBLE TONE UNCLEAR'
                        : `${result.skinToneAssessment?.visibleToneBand?.toUpperCase() ?? 'UNCLEAR'} VISIBLE TONE`}
                    </Text>
                    <Text style={styles.skinToneScoreLabel}>SINGLE-IMAGE RECOGNITION RISK</Text>
                  </View>
                  <Text style={[
                    styles.skinToneScore,
                    result.skinToneAssessment?.status === 'potential_concern' && styles.skinToneScoreWatch,
                  ]}>
                    {result.skinToneAssessment?.riskScore === null || result.skinToneAssessment?.riskScore === undefined
                      ? 'LIMITED'
                      : `${result.skinToneAssessment.riskScore}/100`}
                  </Text>
                </View>
                <Text style={styles.skinToneExplanation}>{result.skinToneAssessment?.explanation ?? 'The current analysis does not include enough visible evidence.'}</Text>
                {result.skinToneAssessment?.recommendation
                  ? <Text style={styles.skinToneRecommendation}>NEXT STEP · {result.skinToneAssessment.recommendation}</Text>
                  : null}
                <Text style={styles.recognitionReviewNote}>This estimates image-level clothing-recognition risk from visible lighting and contrast. It is not proof of demographic bias.</Text>
              </View>

              <Text style={styles.contextTitle}>BODY-TYPE RESULT</Text>
              <View style={styles.predictionRow}>
                <Text style={styles.predictionKind}>IMAGE-ONLY VISUAL GROUP</Text>
                <Text style={styles.predictionValue}>
                  {result.bodyTypeAssessment?.visibleGroup === 'unclear'
                    ? 'Unclear'
                    : `${result.bodyTypeAssessment?.visibleGroup?.charAt(0).toUpperCase() ?? ''}${result.bodyTypeAssessment?.visibleGroup?.slice(1) ?? ''}`}
                  {result.bodyTypeAssessment ? ` · ${result.bodyTypeAssessment.confidence}%` : ''}
                </Text>
              </View>
              {result.bodyTypeAssessment?.explanation
                ? <Text style={styles.predictionExplanation}>{result.bodyTypeAssessment.explanation}</Text>
                : null}
              <Text style={styles.recognitionReviewNote}>This is a broad fashion-fit estimate from the visible silhouette—not an identity, health, weight, or attractiveness judgment.</Text>
              <Text style={styles.contextLabel}>Confirm or correct the group</Text>
              <View style={styles.contextChips}>
                {bodyTypeGroups.map((group) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: currentSaved?.recognitionReview?.bodyTypeGroup === group, disabled: !currentSaved }}
                    disabled={!currentSaved}
                    key={group}
                    onPress={() => saveRecognitionReview(
                      { bodyTypeGroup: currentSaved?.recognitionReview?.bodyTypeGroup === group ? undefined : group },
                      'Body-type evaluation group updated.',
                    )}
                    style={({ pressed }) => [styles.contextChip, currentSaved?.recognitionReview?.bodyTypeGroup === group && styles.contextChipSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.contextChipText, currentSaved?.recognitionReview?.bodyTypeGroup === group && styles.contextChipTextSelected]}>{group}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.recognitionReviewNote}>Each tab updates immediately after its required review data is saved.</Text>
            </View>

            <View style={styles.findings}>
              <Text style={styles.findingsTitle}>QUICK FAIRNESS CHECK</Text>
              {result.findings.map((finding) => (
                <View key={finding.category} style={styles.finding}>
                  <View style={[styles.findingDot, finding.status === 'potential_concern' && styles.findingDotWatch]} />
                  <View style={styles.findingCopy}>
                    <Text style={styles.findingLabel}>{finding.label}</Text>
                    {finding.status === 'potential_concern'
                      ? <Text style={styles.findingDetail}>{finding.explanation}</Text>
                      : null}
                  </View>
                  <Text style={[styles.findingStatus, finding.status === 'potential_concern' && styles.findingStatusWatch]}>
                    {finding.status === 'potential_concern'
                      ? 'REVIEW'
                      : finding.status === 'none_observed'
                        ? 'CLEAR'
                        : 'LIMITED'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>RECOMMENDED NEXT STEPS</Text>
              {uniqueRecommendations(result.recommendations).map((recommendation) => (
                <View key={recommendation} style={styles.recommendationRow}>
                  <Text style={styles.bullet}>✦</Text>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </LinearGradient>

      <View style={styles.library}>
        <View style={styles.libraryHeader}>
          <View>
            <Text style={styles.libraryEyebrow}>PRIVATE OUTFIT LIBRARY</Text>
            <Text style={styles.libraryTitle}>Saved analyses</Text>
          </View>
          <View style={styles.localPill}><Text style={styles.localPillText}>ON THIS DEVICE</Text></View>
        </View>
        <Text style={styles.libraryBody}>Completed image analyses are compressed and saved locally. Up to 100 recent results contribute to the dashboard average.</Text>
        {storageMessage ? <Text style={styles.storageMessage}>{storageMessage}</Text> : null}

        {savedAnalyses.length > 0 ? (
          <ScrollView contentContainerStyle={styles.savedRail} horizontal showsHorizontalScrollIndicator={false}>
            {savedAnalyses.map((saved) => (
              <Pressable
                accessibilityHint="Opens the saved AI findings"
                accessibilityLabel={`Saved analysis for ${saved.fileName}`}
                accessibilityRole="button"
                key={saved.id}
                onPress={() => openSavedAnalysis(saved)}
                style={({ pressed }) => [styles.savedCard, pressed && styles.savedCardPressed]}
              >
                <Image source={{ uri: saved.imageUri }} style={styles.savedImage} />
                <LinearGradient colors={['transparent', 'rgba(12,11,31,0.96)']} style={styles.savedShade} />
                <Pressable
                  accessibilityLabel={`Remove saved analysis for ${saved.fileName}`}
                  accessibilityHint="Deletes the saved image and its AI findings after confirmation"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmRemoveSavedAnalysis(saved);
                  }}
                  style={({ pressed }) => [styles.removeSaved, pressed && styles.removeSavedPressed]}
                >
                  <Text style={styles.removeSavedIcon}>×</Text>
                  <Text style={styles.removeSavedText}>DELETE</Text>
                </Pressable>
                <View style={styles.savedCopy}>
                  <Text numberOfLines={1} style={styles.savedName}>{saved.fileName}</Text>
                  <View style={styles.savedMetaRow}>
                    <Text style={styles.savedDate}>{new Date(saved.savedAt).toLocaleDateString()}</Text>
                    <Text style={styles.savedRisk}>{saved.result.riskScore === null ? 'NOT SCORED' : `${saved.result.riskScore}/100 RISK`}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyLibrary}>
            <View style={styles.emptyLibraryIcon}><Text style={styles.emptyLibraryIconText}>◇</Text></View>
            <View style={styles.emptyLibraryCopy}>
              <Text style={styles.emptyLibraryTitle}>Nothing saved yet</Text>
              <Text style={styles.emptyLibraryBody}>Your first completed analysis will appear here.</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 25 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 12 },
  eyebrow: { color: colors.violet, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 4, color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  aiPill: { borderWidth: 1, borderColor: '#DCD3F8', borderRadius: 999, backgroundColor: '#F0EBFF', paddingHorizontal: 9, paddingVertical: 6 },
  aiPillText: { color: colors.violet, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  card: { overflow: 'hidden', borderRadius: 28, padding: 14 },
  orb: { position: 'absolute', right: -45, top: -55, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(121,87,255,0.16)' },
  uploadArea: { height: 190, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,184,255,0.28)', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.055)' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  uploadIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#494266', borderRadius: 16, backgroundColor: '#282342' },
  uploadIconText: { color: colors.electric, fontSize: 24, fontWeight: '700', marginTop: -3 },
  uploadTitle: { marginTop: 12, color: colors.surface, fontSize: 15, fontWeight: '900' },
  uploadBody: { marginTop: 5, color: '#918BA3', fontSize: 10, lineHeight: 14, textAlign: 'center' },
  formatPill: { marginTop: 12, borderRadius: 999, backgroundColor: 'rgba(141,231,255,0.09)', paddingHorizontal: 10, paddingVertical: 6 },
  formatText: { color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  preview: { width: '100%', height: '100%' },
  previewShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  changePill: { position: 'absolute', right: 10, top: 10, borderRadius: 999, backgroundColor: 'rgba(17,17,38,0.78)', paddingHorizontal: 9, paddingVertical: 6 },
  changeText: { color: colors.surface, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  fileCopy: { position: 'absolute', left: 14, right: 14, bottom: 13 },
  fileName: { color: colors.surface, fontSize: 13, fontWeight: '900' },
  fileMeta: { marginTop: 3, color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  error: { marginTop: 10, color: '#FFAD96', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  buttonShell: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.42 },
  button: { height: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16 },
  buttonSpark: { color: colors.surface, fontSize: 17 },
  buttonText: { color: colors.surface, fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  privacyNote: { marginTop: 8, color: '#77718F', fontSize: 8, lineHeight: 12, textAlign: 'center' },
  result: { marginTop: 15, borderWidth: 1, borderColor: 'rgba(141,231,255,0.18)', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.055)', padding: 14 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultEyebrow: { color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  resultTitle: { marginTop: 3, color: colors.surface, fontSize: 16, fontWeight: '900' },
  score: { flexDirection: 'row', alignItems: 'baseline', borderRadius: 999, backgroundColor: 'rgba(141,231,255,0.11)', paddingHorizontal: 10, paddingVertical: 7 },
  scoreValue: { color: colors.electric, fontSize: 16, fontWeight: '900' },
  unscoredValue: { color: colors.lavender, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  scoreUnit: { color: '#9690A8', fontSize: 8, fontWeight: '800' },
  summary: { marginTop: 10, color: '#B9B4C8', fontSize: 10, lineHeight: 15 },
  scopeNoteBox: { marginTop: 9, borderLeftWidth: 2, borderLeftColor: colors.lavender, borderRadius: 4, backgroundColor: 'rgba(187,168,255,0.06)', paddingHorizontal: 9, paddingVertical: 7 },
  scopeNoteLabel: { color: colors.lavender, fontSize: 6, fontWeight: '900', letterSpacing: 0.8 },
  scopeNote: { marginTop: 3, color: '#918BA3', fontSize: 8, lineHeight: 12 },
  recognitionReview: { marginTop: 13, borderWidth: 1, borderColor: 'rgba(141,231,255,0.22)', borderRadius: 15, backgroundColor: 'rgba(141,231,255,0.07)', padding: 11 },
  recognitionReviewEyebrow: { color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  recognitionReviewText: { marginTop: 6, color: '#C4BED1', fontSize: 9, lineHeight: 13 },
  predictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  predictionKind: { color: '#8F89A1', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  predictionValue: { flex: 1, color: colors.electric, fontSize: 10, fontWeight: '900', textAlign: 'right' },
  predictionExplanation: { marginTop: 5, color: '#928CA4', fontSize: 8, lineHeight: 12 },
  recognitionReviewQuestion: { marginTop: 8, color: colors.surface, fontSize: 10, fontWeight: '900' },
  recognitionReviewActions: { flexDirection: 'row', gap: 7, marginTop: 9 },
  reviewButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#46405F', borderRadius: 11, backgroundColor: '#24203E', paddingHorizontal: 7, paddingVertical: 9 },
  reviewButtonCorrect: { borderColor: colors.electric, backgroundColor: 'rgba(141,231,255,0.16)' },
  reviewButtonIncorrect: { borderColor: colors.amber, backgroundColor: 'rgba(255,145,112,0.14)' },
  reviewButtonText: { color: colors.surface, fontSize: 8, fontWeight: '900' },
  recognitionReviewNote: { marginTop: 8, color: '#8F89A1', fontSize: 8, lineHeight: 12 },
  contextTitle: { marginTop: 15, color: colors.lavender, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  skinToneAssessment: { marginTop: 8, borderWidth: 1, borderColor: 'rgba(187,168,255,0.22)', borderRadius: 13, backgroundColor: 'rgba(187,168,255,0.07)', padding: 10 },
  skinToneScoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  skinToneBand: { color: colors.surface, fontSize: 9, fontWeight: '900' },
  skinToneScoreLabel: { marginTop: 3, color: '#817B96', fontSize: 6, fontWeight: '900', letterSpacing: 0.6 },
  skinToneScore: { color: colors.electric, fontSize: 15, fontWeight: '900' },
  skinToneScoreWatch: { color: colors.amber },
  skinToneExplanation: { marginTop: 8, color: '#BEB8CD', fontSize: 8, lineHeight: 12 },
  skinToneRecommendation: { marginTop: 6, color: colors.lavender, fontSize: 8, lineHeight: 12 },
  contextLabel: { marginTop: 10, color: colors.surface, fontSize: 9, fontWeight: '900' },
  contextChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  contextChip: { borderWidth: 1, borderColor: '#46405F', borderRadius: 999, backgroundColor: '#24203E', paddingHorizontal: 9, paddingVertical: 7 },
  contextChipSelected: { borderColor: colors.electric, backgroundColor: 'rgba(141,231,255,0.16)' },
  contextChipText: { color: '#AAA4BB', fontSize: 8, fontWeight: '800' },
  contextChipTextSelected: { color: colors.surface },
  findings: { marginTop: 11, gap: 8 },
  findingsTitle: { color: colors.lavender, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  finding: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 9 },
  findingDot: { width: 6, height: 6, marginTop: 4, borderRadius: 3, backgroundColor: colors.electric },
  findingDotWatch: { backgroundColor: colors.amber },
  findingCopy: { flex: 1 },
  findingLabel: { color: colors.surface, fontSize: 10, fontWeight: '900' },
  findingDetail: { marginTop: 2, color: '#858096', fontSize: 8, lineHeight: 12 },
  findingStatus: { color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  findingStatusWatch: { color: colors.amber },
  recommendationBox: { marginTop: 13, borderRadius: 15, backgroundColor: 'rgba(121,87,255,0.13)', padding: 11 },
  recommendationTitle: { color: colors.lavender, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  recommendationRow: { flexDirection: 'row', gap: 7, marginTop: 7 },
  bullet: { color: colors.electric, fontSize: 9 },
  recommendationText: { flex: 1, color: '#BEB8CD', fontSize: 9, lineHeight: 13 },
  library: { marginTop: 16, borderWidth: 1, borderColor: '#DFD8F2', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.66)', padding: 14 },
  libraryHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  libraryEyebrow: { color: colors.violet, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  libraryTitle: { marginTop: 3, color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  localPill: { borderRadius: 999, backgroundColor: '#EEE9FF', paddingHorizontal: 8, paddingVertical: 6 },
  localPillText: { color: colors.violet, fontSize: 6, fontWeight: '900', letterSpacing: 0.7 },
  libraryBody: { marginTop: 7, color: colors.muted, fontSize: 9, lineHeight: 13 },
  storageMessage: { marginTop: 7, color: '#6F63A8', fontSize: 8, fontWeight: '800' },
  savedRail: { gap: 10, paddingTop: 12, paddingRight: 10 },
  savedCard: { width: 172, height: 132, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.midnight },
  savedCardPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  savedImage: { width: '100%', height: '100%' },
  savedShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
  removeSaved: { position: 'absolute', top: 8, right: 8, height: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', borderRadius: 14, backgroundColor: 'rgba(17,17,38,0.88)', paddingHorizontal: 8 },
  removeSavedPressed: { backgroundColor: 'rgba(255,145,112,0.9)' },
  removeSavedIcon: { marginTop: -1, color: '#FFB39E', fontSize: 15, lineHeight: 17, fontWeight: '800' },
  removeSavedText: { color: colors.surface, fontSize: 6, fontWeight: '900', letterSpacing: 0.6 },
  savedCopy: { position: 'absolute', left: 11, right: 11, bottom: 10 },
  savedName: { color: colors.surface, fontSize: 10, fontWeight: '900' },
  savedMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  savedDate: { color: '#A9A3B9', fontSize: 7, fontWeight: '700' },
  savedRisk: { color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  emptyLibrary: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, borderWidth: 1, borderColor: '#E5DFF2', borderRadius: 17, backgroundColor: '#FAF8FF', padding: 12 },
  emptyLibraryIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.midnight },
  emptyLibraryIconText: { color: colors.electric, fontSize: 16, fontWeight: '900' },
  emptyLibraryCopy: { flex: 1 },
  emptyLibraryTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  emptyLibraryBody: { marginTop: 2, color: colors.muted, fontSize: 8, lineHeight: 12 },
});

