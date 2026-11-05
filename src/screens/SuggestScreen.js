import GarmentIllustration from '../components/GarmentIllustration';
import { palette } from '../theme/tokens';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  useWindowDimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { OCCASIONS, WARDROBE, generateRecommendations } = require('../features/suggest/outfitRecommendations');
const { getSwapChoices, applyOutfitSwaps } = require('../features/suggest/outfitSwaps');
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
  onOpenQuiz = () => {},
  onOpenWardrobe = () => {},
  onRetryStorage = () => {},
}) {
  const { width } = useWindowDimensions();
  const [refining, setRefining] = useState(false);
  const [expandedOutfit, setExpandedOutfit] = useState('');
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

  const [swaps, setSwaps] = useState({});
  const [picker, setPicker] = useState(null);
  const [swapNotice, setSwapNotice] = useState('');
  const swapKey = (cardId) => `${wardrobeMode}:${occasion}:${cardId}`;
  const outfits = result.recommendations.map((base) =>
    applyOutfitSwaps(base, swaps[swapKey(base.signature)], activeWardrobe, profile, weatherCondition));
  const pickedOutfit = picker && outfits.find((outfit) => outfit.cardId === picker.cardId);
  const pickedItem = pickedOutfit?.items.find((item) => item.category === picker?.category);
  const choices = pickedItem ? getSwapChoices(activeWardrobe, occasion, picker.category) : [];

  function openPicker(outfit, item) {
    setPicker({ cardId: outfit.cardId, category: item.category });
  }
  function chooseReplacement(item) {
    if (!pickedOutfit || !choices.some((choice) => choice.id === item.id)) return;
    const key = swapKey(pickedOutfit.cardId);
    setSwaps((current) => ({ ...current, [key]: { ...current[key], [item.category]: item.id } }));
    setSwapNotice(`${item.name} selected. Other pieces kept in place.`);
    setPicker(null);
  }
  function resetOutfit(outfit) {
    const key = swapKey(outfit.cardId);
    setSwaps((current) => { const next = { ...current }; delete next[key]; return next; });
    setSwapNotice('Outfit reset to the original recommendation.');
  }

  function selectOccasion(nextOccasion) {
    setSwaps({});
    setPicker(null);
    setSwapNotice('');
    setOccasion(nextOccasion);
    setShownSignatures([]);
    setExpandedExplanation('');
  }

  function generateAnotherThree() {
    setSwaps({});
    setPicker(null);
    setSwapNotice('');
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
    setSwaps({});
    setPicker(null);
    setSwapNotice('');
    setVariety(nextVariety);
    setShownSignatures([]);
    setExpandedExplanation('');
  }

  function changeWeather(nextCondition) {
    setSwaps({});
    setPicker(null);
    setSwapNotice('');
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


  return (
    <View style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>YOUR CLOSET. NEW POSSIBILITIES.</Text>
            <Text style={styles.title}>
              Good outfits.{'\n'}Less effort<Text style={styles.titlePeriod}>.</Text>
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

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Dress for your day</Text>
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

          <Pressable accessibilityRole="button" accessibilityState={{ expanded: refining }} onPress={() => setRefining(!refining)} style={styles.refineButton}>
            <Text style={styles.refineText}>{refining ? 'Close refinements −' : 'Refine your edit +'}{weatherCondition ? ` · ${weatherCondition}` : ''}</Text>
          </Pressable>
          {refining ? <View style={styles.controlsCard}>
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
          </View> : null}

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

          <Text accessibilityLiveRegion="polite" style={styles.swapNotice}>{swapNotice || 'Make it yours. Tap any piece to see alternatives.'}</Text>
          {result.recommendations.length > 0 ? (
            <View style={styles.outfitGrid}>{outfits.map((recommendation) => (
              <View key={recommendation.cardId || recommendation.items.map((item) => item.id).join('|')} style={[styles.outfitCard, width >= 1000 && styles.outfitCardWide]}>
                <View style={styles.illustrationPanel}>
                  <Text style={styles.illustrationEyebrow}>
                    {recommendation.rank === 1 ? '01 / THE TOP PICK' : `${String(recommendation.rank).padStart(2, '0')} / THE EDIT`}
                  </Text>
                  <View style={styles.illustrationItems}>
                    {recommendation.items.map((item) => {
                      const position = { top: [0, 0], bottom: [1, 0], shoes: [0, 1], layer: [1, 1] }[item.category];
                      if (!position) return null;
                      return (
                        <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Swap ${item.category}: ${item.name}`} onPress={() => openPicker(recommendation, item)} style={[styles.illustrationItem, styles[`illustration_${item.category}`]]}>
                          <GarmentIllustration category={item.category} colorHex={item.colorHex} photoUri={item.photoUri} />
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.illustrationDisclaimer}>Tap a piece to swap · illustrations approximate shape</Text>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.featureTopLine}>
                    <Text style={styles.featureEyebrow}>
                      {recommendation.customized ? 'YOUR CUSTOM EDIT' : recommendation.rank === 1 ? 'FITCHECK PICK' : `OUTFIT ${recommendation.rank}`}
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
                      <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Change ${item.category}: ${item.name}`} onPress={() => openPicker(recommendation, item)} style={styles.paletteItem}>
                        <View
                          style={[
                            styles.paletteSwatch,
                            item.colorHex ? { backgroundColor: item.colorHex } : styles.unknownSwatch,
                            item.colorHex === '#F4F4EF' && styles.lightSwatch,
                          ]}
                        />
                        <Text style={styles.paletteLabel}>{item.category} ↻</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {recommendation.customized ? <Pressable accessibilityRole="button" accessibilityLabel={`Reset outfit ${recommendation.rank}`} onPress={() => resetOutfit(recommendation)} style={styles.detailsButton}>
                  <Text style={styles.refineText}>Reset outfit ↺</Text>
                </Pressable> : null}
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: expandedOutfit === recommendation.cardId }} onPress={() => setExpandedOutfit(expandedOutfit === recommendation.cardId ? '' : recommendation.cardId)} style={styles.detailsButton}>
                  <Text style={styles.refineText}>{expandedOutfit === recommendation.cardId ? 'Hide outfit details −' : 'Explore the pieces +'} </Text>
                </Pressable>
                {expandedOutfit === recommendation.cardId ? <View>
                <View style={styles.piecesHeader}>
                  <Text style={styles.sectionLabel}>THE PIECES</Text>
                  <Text style={styles.pieceCount}>{recommendation.items.length} ITEMS</Text>
                </View>
                <View style={styles.pieceList}>
                  {recommendation.items.map((item, index) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Replace ${item.category}: ${item.name}`}
                      onPress={() => openPicker(recommendation, item)}
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
                      <Text style={styles.pieceColor}>{item.color || 'Color not provided'} ↻</Text>
                    </Pressable>
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
                    accessibilityState={{ expanded: expandedExplanation === recommendation.cardId }}
                    accessibilityHint="Shows the actual factors and weights used for this match"
                    onPress={() => setExpandedExplanation((current) =>
                      current === recommendation.cardId ? '' : recommendation.cardId)}
                    style={styles.whyButton}
                  >
                    <Text style={styles.whyButtonText}>
                      {expandedExplanation === recommendation.cardId ? 'Hide match details' : 'Why this outfit?'}
                    </Text>
                    <Text style={styles.whyButtonArrow}>
                      {expandedExplanation === recommendation.cardId ? '−' : '+'}
                    </Text>
                  </Pressable>
                  {expandedExplanation === recommendation.cardId ? (
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
                </View> : null}
              </View>
            ))}</View>
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
      <Modal visible={Boolean(pickedItem)} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <View style={styles.pickerBackdrop}>
          <View accessibilityViewIsModal style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <Text accessibilityRole="header" style={styles.pickerTitle}>Choose your {picker?.category}.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close piece picker" onPress={() => setPicker(null)} style={styles.pickerClose}><Text>Close ×</Text></Pressable>
            </View>
            <Text style={styles.pickerSubtitle}>Available for {occasion} · the rest of your outfit stays in place.</Text>
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {choices.map((item) => (
                <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === pickedItem?.id }} accessibilityLabel={`${item.name}, ${item.color || 'color unspecified'}`} onPress={() => chooseReplacement(item)} style={[styles.pickerChoice, item.id === pickedItem?.id && styles.pickerSelected]}>
                  <View style={styles.pickerImage}><GarmentIllustration category={item.category} colorHex={item.colorHex} photoUri={item.photoUri} /></View>
                  <View style={styles.pieceCopy}><Text style={styles.pieceName}>{item.name}</Text><Text style={styles.pickerSubtitle}>{item.color || 'Color unspecified'}</Text></View>
                  <Text style={styles.pickerCheck}>{item.id === pickedItem?.id ? '✓' : '+'}</Text>
                </Pressable>
              ))}
              {choices.length <= 1 ? <Text style={styles.pickerSubtitle}>No other available {picker?.category} pieces for {occasion}. Add more in Wardrobe to expand your choices.</Text> : null}
            </ScrollView>
            <Text style={styles.pickerSubtitle}>Swaps last for this session. Reset outfit restores the original pieces.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const colors = {
  background: '#FCFBF9',
  ink: '#151515',
  muted: '#666666',
  black: '#171717',
  lavender: '#EDE5FF',
  line: '#E5E5E5',
  white: '#FFFFFF',
};

const REQUIRED_CATEGORY_LABELS = [
  { id: 'top', label: 'A top' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' },
];

const styles = StyleSheet.create({
  illustrationPanel: { backgroundColor: '#F0EDE7', paddingVertical: 20, paddingHorizontal: 12 },
  illustrationEyebrow: { color: colors.ink, fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 18 },
  illustrationItems: { width: '100%', maxWidth: 520, aspectRatio: 1, alignSelf: 'center' },
  illustrationItem: { position: 'absolute', width: '54%', aspectRatio: 1 },
  illustration_top: { left: '0%', top: '3%', zIndex: 3, transform: [{ rotate: '-7deg' }] },
  illustration_bottom: { right: '5%', bottom: '0%', zIndex: 1 },
  illustration_layer: { right: '0%', top: '0%', zIndex: 2, transform: [{ rotate: '6deg' }] },
  illustration_shoes: { left: '4%', bottom: '1%', width: '38%', zIndex: 4, transform: [{ rotate: '-9deg' }] },
  illustrationDisclaimer: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 12 },
  swapNotice: { color: palette.accent, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  pickerBackdrop: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 18 },
  pickerPanel: { width: '100%', maxWidth: 520, maxHeight: '85%', backgroundColor: palette.background, padding: 20, borderRadius: 8 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pickerTitle: { flex: 1, fontFamily: 'serif', fontSize: 28, color: palette.ink },
  pickerClose: { minWidth: 58, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pickerSubtitle: { color: palette.muted, fontSize: 12, lineHeight: 18, marginVertical: 8 },
  pickerList: { flexShrink: 1, marginVertical: 8 },
  pickerChoice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1, borderColor: palette.line, marginBottom: 8, backgroundColor: palette.paper },
  pickerSelected: { borderColor: palette.accent, backgroundColor: palette.soft },
  pickerImage: { width: 64, height: 76 },
  pickerCheck: { color: palette.accent, fontSize: 22 },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  outfitCardWide: { width: '31.9%' },
  refineButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: palette.line, marginBottom: 18 },
  refineText: { color: palette.ink, fontSize: 12, fontWeight: '600' },
  detailsButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: 1, borderColor: palette.line },
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 22,
  },
  topBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 2,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: colors.lavender, fontSize: 12, fontWeight: '800' },
  brandName: { color: colors.ink, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  brandCaption: { marginTop: 3, color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.1 },
  wardrobeLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wardrobeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  wardrobeText: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  hero: { paddingTop: 28, paddingBottom: 20 },
  eyebrow: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: {
    marginTop: 9,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '400',
  },
  titlePeriod: { color: palette.accent },
  subtitle: { maxWidth: 560, marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 21 },
  controlsCard: {
    gap: 9,
    marginBottom: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 2,
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
    borderRadius: 2,
    backgroundColor: '#FAFAFA',
  },
  controlChipSelected: { borderColor: colors.black, backgroundColor: colors.black },
  controlChipText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  controlChipTextSelected: { color: colors.white },
  quizCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 2,
    backgroundColor: '#FAFAFA',
  },
  quizCardDisabled: { opacity: 0.65 },
  quizCardPressed: { opacity: 0.78 },
  quizCardCopy: { flex: 1 },
  quizEyebrow: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  quizTitle: { marginTop: 5, color: colors.ink, fontSize: 14, fontWeight: '800' },
  quizDescription: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 16 },
  quizArrow: { color: colors.black, fontSize: 23, fontWeight: '600' },
  storageNotice: { marginBottom: 12, padding: 12, borderRadius: 2, backgroundColor: '#F9E8E4' },
  storageNoticeText: { color: '#9B3F35', fontSize: 12, lineHeight: 17 },
  storageRetry: { minHeight: 42, justifyContent: 'center', marginTop: 3 },
  storageRetryText: { color: '#7C302A', fontSize: 12, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionLabel: { color: colors.ink, fontFamily: 'serif', fontSize: 25, fontWeight: '400' },
  sectionCount: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  chip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 24,
    backgroundColor: '#FAFAFA',
  },
  chipSelected: { borderColor: colors.black, backgroundColor: colors.black },
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
  featureCard: { padding: 16, backgroundColor: palette.paper },
  outfitCard: { width: '100%', marginBottom: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  matchBadge: { minWidth: 55, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.14)' },
  matchScore: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  matchLabel: { marginTop: 2, color: palette.ink, fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  featureTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  featureEyebrow: { color: palette.ink, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 2,
    backgroundColor: palette.soft,
  },
  readyDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.lavender },
  readyText: { color: palette.ink, fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  featureTitle: { marginTop: 12, color: palette.ink, fontSize: 25, lineHeight: 30, fontWeight: '600' },
  featureCaption: { marginTop: 4, color: palette.ink, fontSize: 12 },
  paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  paletteItem: {
    minWidth: 68,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  paletteSwatch: { width: 31, height: 18, borderRadius: 5 },
  unknownSwatch: { backgroundColor: '#777777' },
  lightSwatch: { borderWidth: 1, borderColor: '#D6D6D6' },
  paletteLabel: { color: palette.ink, fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  piecesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 8 },
  pieceCount: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  pieceList: { paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: colors.white },
  pieceRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  lastPieceRow: { borderBottomWidth: 0 },
  pieceSwatch: { width: 40, height: 40, borderRadius: 7 },
  pieceCopy: { flex: 1, minWidth: 0 },
  pieceCategory: { color: palette.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  pieceName: { marginTop: 4, color: colors.ink, fontSize: 13, fontWeight: '700' },
  pieceColor: { maxWidth: 76, color: colors.muted, fontSize: 11, textAlign: 'right' },
  missingPieceRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  missingPieceMark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CCCCCC', borderStyle: 'dashed', borderRadius: 7 },
  missingPieceMarkText: { color: colors.muted, fontSize: 20, fontWeight: '500' },
  missingPieceName: { marginTop: 4, color: colors.muted, fontSize: 13, fontWeight: '700' },
  reasonsCard: { marginTop: 10, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: colors.white },
  reasonRow: { flexDirection: 'row', gap: 7, paddingVertical: 5 },
  reasonMark: { color: palette.accent, fontSize: 18, lineHeight: 17, fontWeight: '800' },
  reasonText: { flex: 1, color: colors.ink, fontSize: 11, lineHeight: 16 },
  scoreNote: { marginTop: 6, color: colors.muted, fontSize: 9, lineHeight: 13 },
  noScoreNote: { marginTop: 6, color: colors.muted, fontSize: 10, lineHeight: 15 },
  whyButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEEEEE', marginTop: 8 },
  whyButtonText: { color: colors.black, fontSize: 11, fontWeight: '800' },
  whyButtonArrow: { color: colors.black, fontSize: 19, fontWeight: '700' },
  factorList: { paddingBottom: 7 },
  factorRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  factorCopy: { flex: 1 },
  factorName: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  factorDetail: { marginTop: 3, color: colors.muted, fontSize: 9 },
  factorPercent: { color: colors.black, fontSize: 12, fontWeight: '800' },
  priorityWeights: { marginTop: 8, color: colors.muted, fontSize: 9, lineHeight: 13 },
  guidanceCard: { marginBottom: 14, padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: '#FAFAFA' },
  guidanceTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  guidanceMessage: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 16 },
  guidanceDetail: { marginTop: 5, color: '#80534A', fontSize: 10, lineHeight: 15 },
  addMissingButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, paddingHorizontal: 10, borderRadius: 7, backgroundColor: '#F3EDFC' },
  addMissingText: { color: colors.black, fontSize: 11, fontWeight: '800' },
  addMissingArrow: { color: colors.black, fontSize: 17, fontWeight: '700' },
  emptyState: { padding: 20, borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: colors.white },
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
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  generateButtonDisabled: { opacity: 0.55 },
  generateButtonPressed: { opacity: 0.78 },
  generateButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  generateButtonIcon: { color: colors.white, fontSize: 23, fontWeight: '500' },
  footerNote: { marginTop: 13, color: palette.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
});
