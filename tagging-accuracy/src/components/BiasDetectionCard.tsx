import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { analyzeBiasImage } from '../services/biasAnalysis';
import { colors } from '../theme';
import { BiasAnalysisResult, BiasImageInput } from '../types/bias';

const acceptedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const acceptedExtensions = /\.(jpe?g|png|webp)$/i;

export function BiasDetectionCard() {
  const [image, setImage] = useState<BiasImageInput | null>(null);
  const [result, setResult] = useState<BiasAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;

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
            <Text style={styles.scopeNote}>{result.scopeNote}</Text>
            {result.scoreRationale ? <Text style={styles.scoreRationale}>{result.scoreRationale}</Text> : null}

            <View style={styles.findings}>
              {result.findings.map((finding) => (
                <View key={finding.category} style={styles.finding}>
                  <View style={[styles.findingDot, finding.status === 'potential_concern' && styles.findingDotWatch]} />
                  <View style={styles.findingCopy}>
                    <Text style={styles.findingLabel}>{finding.label}</Text>
                    <Text style={styles.findingDetail}>{finding.explanation}</Text>
                    {finding.evidence.map((item) => <Text key={item} style={styles.evidence}>• {item}</Text>)}
                    <Text style={styles.findingRecommendation}>{finding.recommendation}</Text>
                  </View>
                  <Text style={[styles.findingStatus, finding.status === 'potential_concern' && styles.findingStatusWatch]}>
                    {finding.status === 'potential_concern'
                      ? 'POTENTIAL'
                      : finding.status === 'none_observed'
                        ? 'NONE SEEN'
                        : 'LIMITED'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>HOW TO IMPROVE FAIRNESS</Text>
              {result.recommendations.map((recommendation) => (
                <View key={recommendation} style={styles.recommendationRow}>
                  <Text style={styles.bullet}>✦</Text>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </LinearGradient>
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
  scopeNote: { marginTop: 9, borderLeftWidth: 2, borderLeftColor: colors.lavender, paddingLeft: 9, color: '#918BA3', fontSize: 9, lineHeight: 14 },
  scoreRationale: { marginTop: 8, color: colors.electric, fontSize: 8, lineHeight: 12 },
  findings: { marginTop: 11, gap: 8 },
  finding: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 9 },
  findingDot: { width: 6, height: 6, marginTop: 4, borderRadius: 3, backgroundColor: colors.electric },
  findingDotWatch: { backgroundColor: colors.amber },
  findingCopy: { flex: 1 },
  findingLabel: { color: colors.surface, fontSize: 10, fontWeight: '900' },
  findingDetail: { marginTop: 2, color: '#858096', fontSize: 8, lineHeight: 12 },
  evidence: { marginTop: 3, color: '#A9A3B9', fontSize: 8, lineHeight: 12 },
  findingRecommendation: { marginTop: 5, color: colors.lavender, fontSize: 8, lineHeight: 12 },
  findingStatus: { color: colors.electric, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  findingStatusWatch: { color: colors.amber },
  recommendationBox: { marginTop: 13, borderRadius: 15, backgroundColor: 'rgba(121,87,255,0.13)', padding: 11 },
  recommendationTitle: { color: colors.lavender, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  recommendationRow: { flexDirection: 'row', gap: 7, marginTop: 7 },
  bullet: { color: colors.electric, fontSize: 9 },
  recommendationText: { flex: 1, color: '#BEB8CD', fontSize: 9, lineHeight: 13 },
});

