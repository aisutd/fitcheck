import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { OCCASIONS, WARDROBE, generateRecommendations } = require('../features/suggest/outfitRecommendations');
const { getActiveWardrobeItems } = require('../features/wardrobe/wardrobeModel');

const OCCASION_NOTES = {
  Work: 'A considered uniform for getting things done.',
  'Date Night': 'A little polish, with room to feel like you.',
  Casual: 'Easy pieces with a point of view.',
  Formal: 'Clean lines for a more elevated moment.',
  Gym: 'Made to move, from warm-up to cool-down.',
};

const OCCASION_INDEX = {
  Work: '01',
  'Date Night': '02',
  Casual: '03',
  Formal: '04',
  Gym: '05',
};

export default function SuggestScreen({
  profile = null,
  draft = null,
  storageError = '',
  storageReady = true,
  wardrobeReady = true,
  wardrobeState = null,
  avatarReady = false,
  avatarError = '',
  onOpenQuiz = () => {},
  onOpenWardrobe = () => {},
  onOpenAvatarStudio = () => {},
  onRetryStorage = () => {},
}) {
  const wardrobeMode = wardrobeState?.mode || 'personal';
  const activeWardrobe = useMemo(
    () => wardrobeState
      ? getActiveWardrobeItems(wardrobeState, WARDROBE)
      : WARDROBE,
    [wardrobeState],
  );
  const fullWardrobe = useMemo(
    () => wardrobeState
      ? wardrobeMode === 'demo'
        ? WARDROBE.map((item) => ({
          ...item,
          available: wardrobeState.demoAvailability?.[item.id] !== false,
        }))
        : wardrobeState.personalItems
      : WARDROBE,
    [wardrobeState, wardrobeMode],
  );
  const [occasion, setOccasion] = useState('Work');
  const [weatherCondition, setWeatherCondition] = useState('');
  const initialVariety = {
    classic: 'familiar',
    balanced: 'balanced',
    adventurous: 'creative',
  }[profile?.answers?.q9?.adventurousness] || 'balanced';
  const [variety, setVariety] = useState(initialVariety);
  const [shownSignatures, setShownSignatures] = useState([]);
  const [expandedExplanation, setExpandedExplanation] = useState('');
  const result = useMemo(
    () => generateRecommendations(occasion, activeWardrobe, profile, {
      variety,
      weatherCondition,
      previousSignatures: shownSignatures,
      fullWardrobe,
      recentlyDeleted: wardrobeState?.recentlyDeleted || [],
    }),
    [occasion, activeWardrobe, profile, variety, weatherCondition, shownSignatures, fullWardrobe, wardrobeState],
  );

  function selectOccasion(nextOccasion) {
    setOccasion(nextOccasion);
    setShownSignatures([]);
    setExpandedExplanation('');
  }

  function generateAnotherThree() {
    if (!result.recommendations.length) return;
    if (!result.moreAvailable) {
      setShownSignatures([]);
      setExpandedExplanation('');
      return;
    }
    setShownSignatures((current) => [...new Set([...current, ...result.signatures])]);
    setExpandedExplanation('');
  }

  function changeVariety(nextVariety) {
    setVariety(nextVariety);
    setShownSignatures([]);
    setExpandedExplanation('');
  }

  function changeWeather(nextCondition) {
    setWeatherCondition(nextCondition);
    setShownSignatures([]);
    setExpandedExplanation('');
  }

  const quizActionTitle = draft
    ? profile ? 'Resume profile edits' : 'Resume your style quiz'
    : profile ? 'Edit your style profile' : 'Get to know your style';
  const quizDescription = draft
    ? profile
      ? 'Your saved profile stays active until you confirm your changes.'
      : 'Your answers are saved on this device. Pick up where you left off.'
    : profile
      ? 'Your style profile is saved on this device.'
      : 'Ten thoughtful questions. A more personal FitCheck.';
  const wardrobeDescription = wardrobeMode === 'demo'
    ? 'Browsing clearly labeled sample pieces. Your personal closet stays separate.'
    : `${wardrobeState?.personalItems?.length || 0} personal pieces saved on this device.`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandGroup}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>FC</Text>
              </View>
              <View>
                <Text style={styles.brandName}>FITCHECK</Text>
                <Text style={styles.brandCaption}>PERSONAL STYLE</Text>
              </View>
            </View>
            <View style={styles.wardrobeLabel}>
              <View style={styles.wardrobeDot} />
              <Text style={styles.wardrobeText}>
                {wardrobeMode === 'demo' ? 'DEMO MODE' : 'PERSONAL WARDROBE'}
              </Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>THE DAILY EDIT</Text>
            <Text style={styles.title}>
              Style Your{'\n'}Day<Text style={styles.titlePeriod}>.</Text>
            </Text>
            <Text style={styles.subtitle}>
              {wardrobeMode === 'demo'
                ? 'A fresh example, thoughtfully put together from the separate demo closet.'
                : 'Outfit suggestions use only clothing you have personally added.'}
            </Text>
          </View>

          {storageError ? (
            <View accessibilityRole="alert" style={styles.storageNotice}>
              <Text style={styles.storageNoticeText}>{storageError}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onRetryStorage}
                style={styles.storageRetry}
              >
                <Text style={styles.storageRetryText}>Retry storage</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityHint={storageReady ? 'Open your saved style quiz or profile' : 'Unavailable until local storage can be read'}
            accessibilityState={{ disabled: !storageReady }}
            disabled={!storageReady}
            onPress={onOpenQuiz}
            style={({ pressed }) => [
              styles.quizCard,
              !storageReady && styles.quizCardDisabled,
              pressed && storageReady && styles.quizCardPressed,
            ]}
          >
            <View style={styles.quizCardCopy}>
              <Text style={styles.quizEyebrow}>
                {profile ? 'YOUR STYLE PROFILE' : 'KNOW YOU'}
              </Text>
              <Text style={styles.quizTitle}>
                {storageReady ? quizActionTitle : 'Style profile unavailable'}
              </Text>
              <Text style={styles.quizDescription}>
                {storageReady ? quizDescription : 'Retry local storage to open your quiz.'}
              </Text>
            </View>
            <Text style={styles.quizArrow}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Add, edit, search, or organize clothing in Personal or Demo Mode"
            accessibilityState={{ disabled: !wardrobeReady }}
            disabled={!wardrobeReady}
            onPress={onOpenWardrobe}
            style={({ pressed }) => [
              styles.quizCard,
              !wardrobeReady && styles.quizCardDisabled,
              pressed && wardrobeReady && styles.quizCardPressed,
            ]}
          >
            <View style={styles.quizCardCopy}>
              <Text style={styles.quizEyebrow}>WARDROBE · {wardrobeMode.toUpperCase()} MODE</Text>
              <Text style={styles.quizTitle}>
                {wardrobeReady ? 'Manage your wardrobe' : 'Wardrobe unavailable'}
              </Text>
              <Text style={styles.quizDescription}>
                {wardrobeReady ? wardrobeDescription : 'Retry local storage to open your wardrobe.'}
              </Text>
            </View>
            <Text style={styles.quizArrow}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityHint={avatarReady
              ? 'Open your interactive 3D avatar and customization controls'
              : 'Unavailable until local avatar settings can be read'}
            accessibilityState={{ disabled: !avatarReady }}
            disabled={!avatarReady}
            onPress={onOpenAvatarStudio}
            style={({ pressed }) => [
              styles.quizCard,
              !avatarReady && styles.quizCardDisabled,
              pressed && avatarReady && styles.quizCardPressed,
            ]}
          >
            <View style={styles.quizCardCopy}>
              <Text style={styles.quizEyebrow}>YOUR 3D AVATAR</Text>
              <Text style={styles.quizTitle}>
                {avatarReady ? 'Open Avatar Studio' : 'Avatar settings unavailable'}
              </Text>
              <Text style={styles.quizDescription}>
                {avatarReady
                  ? 'Customize your look, turn the model, and save changes on this device.'
                  : avatarError || 'Retry local storage to open Avatar Studio.'}
              </Text>
            </View>
            <Text style={styles.quizArrow}>→</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>WHAT&apos;S THE OCCASION?</Text>
            <Text style={styles.sectionCount}>{OCCASION_INDEX[occasion]} / 05</Text>
          </View>

          <View style={styles.chipList}>
            {OCCASIONS.map((option) => {
              const isSelected = occasion === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => selectOccasion(option)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.recommendationHeading}>
            <View>
              <Text style={styles.sectionLabel}>YOUR STYLE EDIT</Text>
              <Text style={styles.recommendationNote}>
                {OCCASION_NOTES[occasion]} Ranked from {result.matchingItemCount} available pieces.
              </Text>
            </View>
          </View>

          <View style={styles.controlsCard}>
            <Text style={styles.controlLabel}>OUTFIT VARIETY</Text>
            <View style={styles.controlChoices}>
              {[
                ['familiar', 'Familiar'],
                ['balanced', 'Balanced'],
                ['creative', 'Creative'],
              ].map(([id, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: variety === id, selected: variety === id }}
                  accessibilityHint={id === 'creative'
                    ? 'Favors variety among clothing details you have entered'
                    : id === 'familiar'
                      ? 'Favors reusing items already shown'
                      : 'Balances your preference score with consistent combinations'}
                  onPress={() => changeVariety(id)}
                  style={[styles.controlChip, variety === id && styles.controlChipSelected]}
                >
                  <Text style={[styles.controlChipText, variety === id && styles.controlChipTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.controlLabel}>MANUAL WEATHER CONTEXT · NO LIVE FORECAST</Text>
            <View style={styles.controlChoices}>
              {[
                ['', 'Not set'],
                ['cold', 'Cold'],
                ['mild', 'Mild'],
                ['hot', 'Hot'],
                ['rainy', 'Rainy'],
              ].map(([id, label]) => (
                <Pressable
                  key={id || 'no-weather'}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: weatherCondition === id, selected: weatherCondition === id }}
                  onPress={() => changeWeather(id)}
                  style={[styles.controlChip, weatherCondition === id && styles.controlChipSelected]}
                >
                  <Text style={[styles.controlChipText, weatherCondition === id && styles.controlChipTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {result.message ? (
            <View style={styles.guidanceCard}>
              <Text style={styles.guidanceTitle}>
                {result.recommendations.some((item) => !item.complete)
                  ? 'A few more pieces make the outfit.'
                  : 'A little more wardrobe context would help.'}
              </Text>
              <Text style={styles.guidanceMessage}>{result.message}</Text>
              {result.unavailableCategories?.length ? (
                <Text style={styles.guidanceDetail}>
                  Temporarily unavailable: {result.unavailableCategories.map((item) => item.label).join(', ')}.
                </Text>
              ) : null}
              {result.recentlyDeletedCategories?.length ? (
                <Text style={styles.guidanceDetail}>
                  Recently deleted: {result.recentlyDeletedCategories.map((item) => item.label).join(', ')}.
                </Text>
              ) : null}
              {result.missingCategories?.length ? (
                <Pressable accessibilityRole="button" onPress={onOpenWardrobe} style={styles.addMissingButton}>
                  <Text style={styles.addMissingText}>
                    {wardrobeMode === 'demo' ? 'Review demo wardrobe' : 'Add missing clothing'}
                  </Text>
                  <Text style={styles.addMissingArrow}>→</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {result.recommendations.length > 0 ? (
            result.recommendations.map((recommendation) => (
              <View key={recommendation.signature || recommendation.items.map((item) => item.id).join('|')} style={styles.outfitCard}>
                <View style={styles.featureCard}>
                  <View style={styles.featureTopLine}>
                    <Text style={styles.featureEyebrow}>
                      {recommendation.rank === 1 ? 'FITCHECK PICK' : `OUTFIT ${recommendation.rank}`}
                    </Text>
                    <View style={styles.readyBadge}>
                      <View style={styles.readyDot} />
                      <Text style={styles.readyText}>
                        {recommendation.complete ? 'COMPLETE' : 'PARTIAL'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>{occasion}, reworked.</Text>
                    {recommendation.score != null ? (
                      <View accessibilityLabel={`Wardrobe match ${recommendation.score} percent`} style={styles.matchBadge}>
                        <Text style={styles.matchScore}>{recommendation.score}%</Text>
                        <Text style={styles.matchLabel}>MATCH</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.featureCaption}>
                    {recommendation.items.length} {recommendation.items.length === 1 ? 'piece' : 'pieces'}
                    {recommendation.complete ? ', one considered look.' : ' in this partial idea.'}
                  </Text>
                  <View style={styles.paletteRow}>
                    {recommendation.items.map((item) => (
                      <View key={item.id} style={styles.paletteItem}>
                        <View
                          style={[
                            styles.paletteSwatch,
                            item.colorHex ? { backgroundColor: item.colorHex } : styles.unknownSwatch,
                            item.colorHex === '#F4F4EF' && styles.lightSwatch,
                          ]}
                        />
                        <Text style={styles.paletteLabel}>{item.category}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.piecesHeader}>
                  <Text style={styles.sectionLabel}>THE PIECES</Text>
                  <Text style={styles.pieceCount}>{recommendation.items.length} ITEMS</Text>
                </View>
                <View style={styles.pieceList}>
                  {recommendation.items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.pieceRow,
                        index === recommendation.items.length - 1 && styles.lastPieceRow,
                      ]}
                    >
                      <View
                        style={[
                          styles.pieceSwatch,
                          item.colorHex ? { backgroundColor: item.colorHex } : styles.unknownSwatch,
                          item.colorHex === '#F4F4EF' && styles.lightSwatch,
                        ]}
                      />
                      <View style={styles.pieceCopy}>
                        <Text style={styles.pieceCategory}>{item.category}</Text>
                        <Text style={styles.pieceName}>{item.name}</Text>
                      </View>
                      <Text style={styles.pieceColor}>{item.color || 'Color not provided'}</Text>
                    </View>
                  ))}
                  {REQUIRED_CATEGORY_LABELS
                    .filter(({ id }) => !recommendation.items.some((item) => item.category === id))
                    .map((missing) => (
                      <View key={missing.id} style={styles.missingPieceRow}>
                        <View style={styles.missingPieceMark}><Text style={styles.missingPieceMarkText}>+</Text></View>
                        <View style={styles.pieceCopy}>
                          <Text style={styles.pieceCategory}>MISSING ESSENTIAL</Text>
                          <Text style={styles.missingPieceName}>{missing.label}</Text>
                        </View>
                      </View>
                    ))}
                </View>

                <View style={styles.reasonsCard}>
                  {recommendation.reasons.map((reason) => (
                    <View key={reason} style={styles.reasonRow}>
                      <Text style={styles.reasonMark}>·</Text>
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                  {recommendation.score == null ? (
                    <Text style={styles.noScoreNote}>
                      Match score not shown until your wardrobe includes details that match your saved preferences.
                    </Text>
                  ) : (
                    <Text style={styles.scoreNote}>
                      Score normalized across available preference details only; unknown details stay neutral.
                    </Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: expandedExplanation === recommendation.signature }}
                    accessibilityHint="Shows the actual factors and weights used for this match"
                    onPress={() => setExpandedExplanation((current) =>
                      current === recommendation.signature ? '' : recommendation.signature)}
                    style={styles.whyButton}
                  >
                    <Text style={styles.whyButtonText}>
                      {expandedExplanation === recommendation.signature ? 'Hide match details' : 'Why this outfit?'}
                    </Text>
                    <Text style={styles.whyButtonArrow}>
                      {expandedExplanation === recommendation.signature ? '−' : '+'}
                    </Text>
                  </Pressable>
                  {expandedExplanation === recommendation.signature ? (
                    <View style={styles.factorList}>
                      {recommendation.factors.length ? recommendation.factors.map((factor) => (
                        <View key={factor.id} style={styles.factorRow}>
                          <View style={styles.factorCopy}>
                            <Text style={styles.factorName}>{factor.label}</Text>
                            <Text style={styles.factorDetail}>
                              {factor.matched} of {factor.evaluated} details · weight {factor.weight}
                            </Text>
                          </View>
                          <Text style={styles.factorPercent}>{Math.round(factor.ratio * 100)}%</Text>
                        </View>
                      )) : (
                        <Text style={styles.noScoreNote}>
                          No preference factor can be evaluated with the details currently available.
                        </Text>
                      )}
                      {profile?.answers?.q4?.priorities?.length === 3 ? (
                        <Text style={styles.priorityWeights}>
                          Your ranked priorities use weights 6 / 3 / 1 in the order saved in your profile.
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No outfit components found.</Text>
              <Text style={styles.emptyMessage}>{result.message}</Text>
              <Pressable accessibilityRole="button" onPress={onOpenWardrobe} style={styles.addMissingButton}>
                <Text style={styles.addMissingText}>Open wardrobe</Text>
                <Text style={styles.addMissingArrow}>→</Text>
              </Pressable>
            </View>
          )}

          {result.recommendations.length ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !result.moreAvailable && shownSignatures.length === 0 }}
              disabled={!result.moreAvailable && shownSignatures.length === 0}
              onPress={generateAnotherThree}
              style={({ pressed }) => [
                styles.generateButton,
                !result.moreAvailable && shownSignatures.length === 0 && styles.generateButtonDisabled,
                pressed && result.moreAvailable && styles.generateButtonPressed,
              ]}
            >
              <Text style={styles.generateButtonText}>
                {!result.moreAvailable && shownSignatures.length ? 'Start over with these outfits' : 'Try Another 3'}
              </Text>
              <Text style={styles.generateButtonIcon}>↻</Text>
            </Pressable>
          ) : null}
          <Text style={styles.footerNote}>
            {wardrobeMode === 'demo'
              ? 'BUILT ONLY FROM THE SEPARATE FITCHECK DEMO WARDROBE'
              : 'BUILT ONLY FROM YOUR PERSONAL FITCHECK WARDROBE'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#F1F4EF',
  ink: '#202B27',
  muted: '#6C7771',
  green: '#27483C',
  lime: '#D4EF87',
  line: '#E2E8E1',
  white: '#FFFFFF',
};

const REQUIRED_CATEGORY_LABELS = [
  { id: 'top', label: 'A top' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' },
];

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 22,
  },
  topBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3DC',
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: colors.lime, fontSize: 12, fontWeight: '800' },
  brandName: { color: colors.ink, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  brandCaption: { marginTop: 3, color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.1 },
  wardrobeLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wardrobeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7E9A68' },
  wardrobeText: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  hero: { paddingTop: 28, paddingBottom: 26 },
  eyebrow: { color: '#627A68', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: {
    marginTop: 9,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '600',
  },
  titlePeriod: { color: '#D8755D' },
  subtitle: { maxWidth: 330, marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 21 },
  controlsCard: {
    gap: 9,
    marginBottom: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  controlLabel: { marginTop: 2, color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  controlChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  controlChip: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: '#FAFBF8',
  },
  controlChipSelected: { borderColor: colors.green, backgroundColor: colors.green },
  controlChipText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  controlChipTextSelected: { color: colors.white },
  quizCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 25,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#D9E1D9',
    borderRadius: 8,
    backgroundColor: '#FAFBF8',
  },
  quizCardDisabled: { opacity: 0.65 },
  quizCardPressed: { opacity: 0.78 },
  quizCardCopy: { flex: 1 },
  quizEyebrow: { color: '#627A68', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  quizTitle: { marginTop: 5, color: colors.ink, fontSize: 14, fontWeight: '800' },
  quizDescription: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 16 },
  quizArrow: { color: colors.green, fontSize: 23, fontWeight: '600' },
  storageNotice: { marginBottom: 12, padding: 12, borderRadius: 8, backgroundColor: '#F9E8E4' },
  storageNoticeText: { color: '#9B3F35', fontSize: 12, lineHeight: 17 },
  storageRetry: { minHeight: 42, justifyContent: 'center', marginTop: 3 },
  storageRetryText: { color: '#7C302A', fontSize: 12, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionLabel: { color: colors.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  sectionCount: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  chip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D9E1D9',
    borderRadius: 20,
    backgroundColor: '#FAFBF8',
  },
  chipSelected: { borderColor: colors.green, backgroundColor: colors.green },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
  recommendationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  recommendationNote: { maxWidth: 300, marginTop: 5, color: colors.muted, fontSize: 12, lineHeight: 17 },
  featureCard: { padding: 18, borderRadius: 8, backgroundColor: colors.green },
  outfitCard: { marginBottom: 20 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  matchBadge: { minWidth: 55, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.14)' },
  matchScore: { color: colors.white, fontSize: 14, fontWeight: '800' },
  matchLabel: { marginTop: 2, color: '#D3DED5', fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  featureTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  featureEyebrow: { color: '#D9E7D4', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  readyDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.lime },
  readyText: { color: colors.white, fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  featureTitle: { marginTop: 20, color: colors.white, fontFamily: 'serif', fontSize: 27, lineHeight: 32, fontWeight: '600' },
  featureCaption: { marginTop: 4, color: '#D3DED5', fontSize: 12 },
  paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  paletteItem: {
    minWidth: 68,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  paletteSwatch: { width: 31, height: 18, borderRadius: 5 },
  unknownSwatch: { backgroundColor: '#6F7F75' },
  lightSwatch: { borderWidth: 1, borderColor: '#D6D8D0' },
  paletteLabel: { color: '#E5ECE3', fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  piecesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 8 },
  pieceCount: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  pieceList: { paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.white },
  pieceRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EEF1EC' },
  lastPieceRow: { borderBottomWidth: 0 },
  pieceSwatch: { width: 40, height: 40, borderRadius: 7 },
  pieceCopy: { flex: 1, minWidth: 0 },
  pieceCategory: { color: '#778179', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  pieceName: { marginTop: 4, color: colors.ink, fontSize: 13, fontWeight: '700' },
  pieceColor: { maxWidth: 76, color: colors.muted, fontSize: 11, textAlign: 'right' },
  missingPieceRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EEF1EC' },
  missingPieceMark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7CEC8', borderStyle: 'dashed', borderRadius: 7 },
  missingPieceMarkText: { color: colors.muted, fontSize: 20, fontWeight: '500' },
  missingPieceName: { marginTop: 4, color: colors.muted, fontSize: 13, fontWeight: '700' },
  reasonsCard: { marginTop: 10, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.white },
  reasonRow: { flexDirection: 'row', gap: 7, paddingVertical: 5 },
  reasonMark: { color: '#627A68', fontSize: 18, lineHeight: 17, fontWeight: '800' },
  reasonText: { flex: 1, color: colors.ink, fontSize: 11, lineHeight: 16 },
  scoreNote: { marginTop: 6, color: colors.muted, fontSize: 9, lineHeight: 13 },
  noScoreNote: { marginTop: 6, color: colors.muted, fontSize: 10, lineHeight: 15 },
  whyButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF1EC', marginTop: 8 },
  whyButtonText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  whyButtonArrow: { color: colors.green, fontSize: 19, fontWeight: '700' },
  factorList: { paddingBottom: 7 },
  factorRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderBottomColor: '#EEF1EC' },
  factorCopy: { flex: 1 },
  factorName: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  factorDetail: { marginTop: 3, color: colors.muted, fontSize: 9 },
  factorPercent: { color: colors.green, fontSize: 12, fontWeight: '800' },
  priorityWeights: { marginTop: 8, color: colors.muted, fontSize: 9, lineHeight: 13 },
  guidanceCard: { marginBottom: 14, padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: '#FAFBF8' },
  guidanceTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  guidanceMessage: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 16 },
  guidanceDetail: { marginTop: 5, color: '#80534A', fontSize: 10, lineHeight: 15 },
  addMissingButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, paddingHorizontal: 10, borderRadius: 7, backgroundColor: '#E7EEE4' },
  addMissingText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  addMissingArrow: { color: colors.green, fontSize: 17, fontWeight: '700' },
  emptyState: { padding: 20, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.white },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  emptyMessage: { marginTop: 7, color: colors.muted, fontSize: 13, lineHeight: 19 },
  inlineMessage: { marginTop: 10, color: colors.muted, fontSize: 12, lineHeight: 18 },
  generateButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 19,
    paddingHorizontal: 17,
    borderRadius: 8,
    backgroundColor: colors.lime,
  },
  generateButtonDisabled: { opacity: 0.55 },
  generateButtonPressed: { opacity: 0.78 },
  generateButtonText: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  generateButtonIcon: { color: colors.green, fontSize: 23, fontWeight: '500' },
  footerNote: { marginTop: 13, color: '#7D8980', fontSize: 8, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
});