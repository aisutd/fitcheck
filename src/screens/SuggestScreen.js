import { useStyleMemory, updateStyleMemory } from '../features/suggest/styleMemoryStore';
import { recordFeedback, toggleSavedLook } from '../features/suggest/styleMemoryModel';
import { router } from 'expo-router';
import OutfitArtwork from '../components/OutfitArtwork';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { OCCASIONS, WARDROBE, generateRecommendations } = require('../features/suggest/outfitRecommendations');
const { getActiveWardrobeItems } = require('../features/wardrobe/wardrobeModel');

const OCCASION_NOTES = {
  Work: 'A considered uniform for getting things done.',
  'Date Night': 'A little polish, with room to feel like you.',
  Casual: 'Easy pieces with a point of view.',
  Formal: 'Clean lines for a more elevated moment.',
  Gym: 'Made to move, from warm-up to cool-down.',
  Concert: 'Pieces you have tagged for your next live show.',
  Travel: 'An easy outfit for the journey.',
  Sleepwear: 'Your sleepwear pieces, with footwear optional.',
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
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.3 ? 1 : width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const cardWidth = (Math.min(1200, width - 40) - (columns - 1) * 20) / columns;
  const [showRefine, setShowRefine] = useState(false);
  const [openLook, setOpenLook] = useState('');
  const wardrobeMode = wardrobeState?.mode || 'personal';
  const memory = useStyleMemory();
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [memoryNotice, setMemoryNotice] = useState({ signature: '', text: '' });
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
      memory: memory.data, mode: wardrobeMode,
    }),
    [occasion, activeWardrobe, profile, variety, weatherCondition, shownSignatures, fullWardrobe, wardrobeState, memory.data, wardrobeMode],
  );

  async function remember(recommendation, kind) {
    setMemoryBusy(true);
    const context = { mode: wardrobeMode, occasion, weather: weatherCondition, signature: recommendation.signature };
    try {
      await updateStyleMemory((state) => kind === 'save'
        ? toggleSavedLook(state, context, recommendation.items)
        : recordFeedback(state, context, kind));
      setMemoryNotice({ signature: recommendation.signature, text: kind === 'save' ? 'Saved looks updated on this device.' : 'Feedback saved. Review and enable learning in Style memory.' });
    } catch (error) { setMemoryNotice({ signature: recommendation.signature, text: error.message }); }
    finally { setMemoryBusy(false); }
  }

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

  const openTools = () => router.push({ pathname: '/style-tools', params: { mode: wardrobeMode } });
  const savedCount = memory.data.saved.filter((look) => look.mode === wardrobeMode).length;
  const quizLabel = draft ? 'Continue your quiz' : profile ? 'Your style profile' : 'Find your personal style';
  function shop(recommendation) {
    const missing = REQUIRED_CATEGORY_LABELS.filter(({ id }) => (occasion !== 'Sleepwear' || id !== 'shoes') && !recommendation.items.some((item) => item.category === id)).map(({ id }) => id);
    router.push({ pathname: '/shopping', params: {
      occasion, category: missing[0] || 'layer', missing: missing.join(','),
      style: profile?.answers?.q1?.styles?.[0] || '',
    } });
  }
  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.wordmark}>fitcheck<Text style={styles.wordmarkDot}>.</Text></Text>
            <View style={styles.modeBadge}><View style={styles.modeDot} /><Text style={styles.modeText}>{wardrobeMode === 'demo' ? 'Demo closet' : 'Your closet'}</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
            <View style={[styles.navItem, styles.navActive]}><Text style={styles.navActiveText}>Outfits</Text></View>
            <NavButton label="Wardrobe" onPress={onOpenWardrobe} disabled={!wardrobeReady} />
            <NavButton label="Avatar" onPress={onOpenAvatarStudio} disabled={!avatarReady} />
            <NavButton label={`Saved & travel${savedCount ? ` · ${savedCount}` : ''}`} onPress={openTools} />
          </ScrollView>
          <View style={[styles.introRow, width >= 900 && styles.introRowWide]}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>YOUR CLOSET. NEW POSSIBILITIES.</Text>
            <Text accessibilityRole="header" style={[styles.title, width < 600 && styles.titleSmall]}>Good outfits. Less effort.</Text>
            <Text style={styles.subtitle}>{wardrobeMode === 'demo' ? 'Explore looks from our sample closet. Make them yours with Know You.' : 'A fresh way to wear the pieces you already own.'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !storageReady }} disabled={!storageReady} onPress={onOpenQuiz}
            style={({ pressed }) => [styles.quizBanner, width >= 900 && styles.quizBannerWide, pressed && styles.pressed, !storageReady && styles.disabled]}>
            <View style={styles.quizIcon}><Text style={styles.quizIconText}>✳</Text></View>
            <View style={styles.flex}><Text style={styles.quizTitle}>{storageReady ? quizLabel : 'Style profile unavailable'}</Text><Text style={styles.quizSubtitle}>{draft ? 'Your progress is saved. Pick up where you left off.' : profile ? 'Your preferences, your priorities. Edit them anytime.' : '10 questions. Outfits that feel more like you.'}</Text></View>
            <Text style={styles.arrow}>↗</Text>
          </Pressable>
          </View>
          {storageError || avatarError || !wardrobeReady ? <View accessibilityRole="alert" style={styles.notice}>
            <Text style={styles.body}>{storageError || avatarError || 'Your wardrobe is still loading.'}</Text>
            <Pressable accessibilityRole="button" onPress={onRetryStorage} style={styles.textButton}><Text style={styles.link}>Retry loading</Text></Pressable>
          </View> : null}
          {memory.error ? <Text accessibilityRole="alert" style={styles.error}>Style memory unavailable: {memory.error}</Text> : null}
          <View style={styles.browseHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>Dress for your day</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showRefine }} onPress={() => setShowRefine(!showRefine)} style={[styles.refineButton, showRefine && styles.refineActive]}><Text style={styles.link}>{showRefine ? 'Close filters −' : `Refine${weatherCondition ? ` · ${weatherCondition}` : ''} +`}</Text></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.occasions}>
            {OCCASIONS.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: occasion === option }} onPress={() => selectOccasion(option)} style={[styles.occasion, occasion === option && styles.occasionSelected]}><Text style={[styles.occasionText, occasion === option && styles.occasionTextSelected]}>{option}</Text></Pressable>)}
          </ScrollView>
          {showRefine ? <View style={styles.filters}>
            <Text style={styles.filterLabel}>Outfit variety</Text>
            <View style={styles.wrap}>{[['familiar','Familiar'],['balanced','Balanced'],['creative','Creative']].map(([id,label]) => <Choice key={id} label={label} selected={variety === id} onPress={() => changeVariety(id)} />)}</View>
            <Text style={styles.filterLabel}>Weather · set manually</Text>
            <View style={styles.wrap}>{[['','Not set'],['cold','Cold'],['mild','Mild'],['hot','Hot'],['rainy','Rainy']].map(([id,label]) => <Choice key={id} label={label} selected={weatherCondition === id} onPress={() => changeWeather(id)} />)}</View>
          </View> : null}
          <View style={styles.resultsHeading}><Text style={styles.editDescription}>{OCCASION_NOTES[occasion]}</Text><Text style={styles.resultCount}>{result.recommendations.length} looks</Text></View>
          {result.message ? <View style={styles.notice}>
            <Text style={styles.quizTitle}>{result.recommendations.some((item) => !item.complete) ? 'Let’s fill in the gaps.' : 'A little more closet context.'}</Text>
            <Text style={styles.body}>{result.message}</Text>
            {result.unavailableCategories?.length ? <Text style={styles.body}>Unavailable: {result.unavailableCategories.map((item) => item.label).join(', ')}.</Text> : null}
            {result.recentlyDeletedCategories?.length ? <Text style={styles.body}>Recently deleted: {result.recentlyDeletedCategories.map((item) => item.label).join(', ')}.</Text> : null}
            <Pressable accessibilityRole="button" onPress={onOpenWardrobe} style={styles.textButton}><Text style={styles.link}>Open wardrobe →</Text></Pressable>
          </View> : null}
          <View style={styles.grid}>
            {result.recommendations.map((recommendation) => {
              const isSaved = memory.data.saved.some((look) => look.mode === wardrobeMode && look.occasion === occasion && look.items.map((item) => item.id).sort().join('|') === recommendation.signature);
              const isOpen = openLook === recommendation.signature;
              return <View key={recommendation.signature} style={[styles.card, { width: cardWidth }]}>
                <View style={styles.artwork}>
                  <OutfitArtwork items={recommendation.items} />
                  <View style={styles.rankBadge}><Text style={styles.rankText}>{recommendation.rank === 1 ? 'THE TOP PICK' : `0${recommendation.rank} / THE EDIT`}</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={isSaved ? 'Remove saved look' : 'Save this look'} accessibilityState={{ selected: isSaved, disabled: !memory.ready || memoryBusy || !recommendation.complete }} disabled={!memory.ready || memoryBusy || !recommendation.complete} onPress={() => remember(recommendation, 'save')} style={[styles.saveButton, (!memory.ready || memoryBusy || !recommendation.complete) && styles.disabled]}><Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>{isSaved ? '♥' : '♡'}</Text></Pressable>
                  <View style={styles.completeBadge}><Text style={styles.completeText}>{recommendation.complete ? 'Complete look' : 'Needs a few pieces'}{recommendation.score != null ? ` · ${recommendation.score}% match` : ''}</Text></View>
                </View>
                <View style={styles.cardHeader}><Text accessibilityRole="header" style={styles.lookTitle}>{LOOK_TITLES[occasion]?.[recommendation.rank - 1] || `${occasion} edit`}</Text><Text style={styles.lookNumber}>0{recommendation.rank}</Text></View>
                <Text style={styles.pieceSummary}>{recommendation.items.map((item) => item.name).join(' · ')}</Text>
                <View style={styles.palette}>{recommendation.items.map((item) => <View key={item.id} accessibilityLabel={item.color || 'Color unspecified'} style={[styles.swatch, { backgroundColor: item.colorHex || '#A9ADA3' }]} />)}<Text style={styles.paletteCaption}>{recommendation.items.length} pieces</Text></View>
                <Pressable accessibilityRole="button" onPress={() => shop(recommendation)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{recommendation.complete ? 'Shop alternatives' : 'Find missing pieces'}</Text><Text style={styles.primaryArrow}>↗</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpenLook(isOpen ? '' : recommendation.signature)} style={styles.detailButton}><Text style={styles.link}>{isOpen ? 'Close outfit details' : 'View pieces & give feedback'}</Text><Text style={styles.arrowSmall}>{isOpen ? '−' : '+'}</Text></Pressable>
                {memoryNotice.signature === recommendation.signature ? <Text accessibilityLiveRegion="polite" style={styles.body}>{memoryNotice.text}</Text> : null}
                {isOpen ? <View style={styles.details}>
                  {recommendation.items.map((item) => <View key={item.id} style={styles.pieceRow}><View style={[styles.pieceDot, { backgroundColor: item.colorHex || '#A9ADA3' }]} /><View style={styles.flex}><Text style={styles.pieceCategory}>{item.category}</Text><Text style={styles.pieceName}>{item.name}</Text></View></View>)}
                  {REQUIRED_CATEGORY_LABELS.filter(({ id }) => (occasion !== 'Sleepwear' || id !== 'shoes') && !recommendation.items.some((item) => item.category === id)).map((item) => <Text key={item.id} style={styles.body}>Missing: {item.label}</Text>)}
                  <Text style={styles.filterLabel}>How does this feel?</Text>
                  <View style={styles.wrap}>{[['like','Like this'],['not-style','Not my style'],['too-warm','Too warm'],['too-cold','Too cold'],['comfortable','Comfortable']].map(([id,label]) => {
                    const disabled = !memory.ready || memoryBusy || (!weatherCondition && ['too-warm','too-cold','comfortable'].includes(id));
                    return <Pressable key={id} accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={() => remember(recommendation, id)} style={[styles.choice, disabled && styles.disabled]}><Text style={styles.choiceText}>{label}</Text></Pressable>;
                  })}</View>
                  {!weatherCondition ? <Text style={styles.body}>Choose weather in Refine to rate comfort.</Text> : null}
                  <Pressable accessibilityRole="button" onPress={openTools} style={styles.textButton}><Text style={styles.link}>Review style memory →</Text></Pressable>
                  {recommendation.feedbackPreference ? <Text style={styles.body}>Style feedback breaks equal-score ties; match percentages stay unchanged.</Text> : null}
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: expandedExplanation === recommendation.signature }} onPress={() => setExpandedExplanation(expandedExplanation === recommendation.signature ? '' : recommendation.signature)} style={styles.detailButton}><Text style={styles.link}>Why this outfit?</Text><Text style={styles.arrowSmall}>{expandedExplanation === recommendation.signature ? '−' : '+'}</Text></Pressable>
                  {expandedExplanation === recommendation.signature ? <View>
                    {recommendation.reasons.map((reason) => <Text key={reason} style={styles.body}>{reason}</Text>)}
                    {recommendation.factors.map((factor) => <Text key={factor.id} style={styles.body}>{factor.label}: {factor.matched}/{factor.evaluated} details · weight {factor.weight} · {Math.round(factor.ratio * 100)}%</Text>)}
                    <Text style={styles.body}>{recommendation.score == null ? 'No match percentage until enough preference details are available.' : 'Match uses available preference details; unknown details stay neutral.'}</Text>
                    {profile?.answers?.q4?.priorities?.length === 3 ? <Text style={styles.body}>Your three priorities use weights 6 / 3 / 1 in saved order.</Text> : null}
                  </View> : null}
                </View> : null}
              </View>;
            })}
          </View>
          {!result.recommendations.length ? <View style={styles.empty}><Text style={styles.sectionTitle}>Your next great outfit starts here.</Text><Text style={styles.subtitle}>Add pieces to your wardrobe, or explore the Demo closet.</Text><Pressable accessibilityRole="button" onPress={onOpenWardrobe} style={styles.primary}><Text style={styles.primaryText}>Open wardrobe →</Text></Pressable></View> : <Pressable accessibilityRole="button" accessibilityState={{ disabled: !result.moreAvailable && !shownSignatures.length }} disabled={!result.moreAvailable && !shownSignatures.length} onPress={generateAnotherThree} style={[styles.moreButton, !result.moreAvailable && !shownSignatures.length && styles.disabled]}><Text style={styles.link}>{!result.moreAvailable && shownSignatures.length ? 'Start this edit again' : 'Discover another 3 looks'} ↻</Text></Pressable>}
          <View style={styles.footer}><Text style={styles.footerBrand}>A little more you.</Text><Text style={styles.footerText}>{wardrobeMode === 'demo' ? 'Sample closet · Illustrated examples, not shop products' : 'Styled from your personal wardrobe'} · {result.matchingItemCount} available pieces</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function NavButton({ label, onPress, disabled = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.navItem, disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.navText}>{label}</Text></Pressable>;
}
function Choice({ label, selected, onPress }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}
const REQUIRED_CATEGORY_LABELS = [{ id: 'top', label: 'A top' }, { id: 'bottom', label: 'Bottoms' }, { id: 'shoes', label: 'Shoes' }];
const LOOK_TITLES = {
  Work: ['Quiet confidence', 'The everyday uniform', 'A softer structure'],
  'Date Night': ['After-hours ease', 'The evening edit', 'A little unexpected'],
  Casual: ['Off-duty, on point', 'The easy rotation', 'Everyday, elevated'],
  Formal: ['An elevated entrance', 'The considered look', 'Clean & composed'],
  Gym: ['Find your rhythm', 'Ready to move', 'The active edit'],
  Concert: ['Setlist ready', 'Out for the night', 'Your encore look'],
  Travel: ['The departure edit', 'Go somewhere good', 'An easy arrival'],
  Sleepwear: ['Slow down', 'The soft landing', 'Stay a little longer'],
};
const ink = '#203C32';
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAF9F6' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  content: { width: '100%', maxWidth: 1240, alignSelf: 'center', paddingHorizontal: 20 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wordmark: { color: ink, fontSize: 34, fontWeight: '700', letterSpacing: -2 },
  wordmarkDot: { color: '#8D9C69' },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  modeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#577346' },
  modeText: { color: '#5D675E', fontSize: 12 },
  nav: { gap: 16, borderBottomWidth: 1, borderColor: '#DCDDD4', minWidth: '100%' },
  navItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 2, borderBottomWidth: 2, borderColor: 'transparent' },
  navActive: { borderColor: ink },
  navActiveText: { fontSize: 13, color: ink, fontWeight: '700' },
  navText: { fontSize: 13, color: '#596059' },
  introRow: { marginBottom: 22 },
  introRowWide: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  hero: { flex: 1, paddingTop: 26, paddingBottom: 22 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: '#5C6F58', fontWeight: '600' },
  title: { marginTop: 12, fontFamily: 'serif', fontSize: 46, lineHeight: 55, letterSpacing: -1.8, color: ink },
  titleSmall: { fontSize: 39, lineHeight: 46, letterSpacing: -1 },
  subtitle: { marginTop: 10, color: '#61675F', fontSize: 14, lineHeight: 22, maxWidth: 590 },
  quizBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, backgroundColor: '#E8EDDF', borderRadius: 3 },
  quizBannerWide: { width: 320, marginTop: 12 },
  quizIcon: { width: 40, height: 40, backgroundColor: '#D9E2CB', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quizIconText: { fontSize: 29, color: ink },
  flex: { flex: 1, minWidth: 0 },
  quizTitle: { fontSize: 14, fontWeight: '600', color: ink },
  quizSubtitle: { fontSize: 12, color: '#55634F', marginTop: 4, lineHeight: 18 },
  arrow: { fontSize: 24, color: ink },
  browseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 22, color: ink, fontFamily: 'serif' },
  refineButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#D9DCD1', borderRadius: 3 },
  refineActive: { backgroundColor: '#E8EDDF' },
  occasions: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  occasion: { minHeight: 44, paddingHorizontal: 18, justifyContent: 'center', borderWidth: 1, borderColor: '#D9DCD1', borderRadius: 24 },
  occasionSelected: { backgroundColor: ink, borderColor: ink },
  occasionText: { color: '#505C50', fontSize: 13 },
  occasionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  resultsHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginVertical: 16 },
  editDescription: { flex: 1, color: '#666C62', fontSize: 12, lineHeight: 18 },
  resultCount: { color: '#666C62', fontSize: 12, lineHeight: 18 },
  filters: { backgroundColor: '#F0F1E9', padding: 16, marginTop: 12, gap: 10 },
  filterLabel: { color: ink, fontSize: 12, fontWeight: '600', marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#D7DBD0', borderRadius: 3, backgroundColor: '#FAF9F6' },
  choiceSelected: { backgroundColor: ink, borderColor: ink },
  choiceText: { color: ink, fontSize: 12 },
  choiceTextSelected: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 },
  card: { minWidth: 0, paddingBottom: 20 },
  artwork: { position: 'relative', borderRadius: 3, overflow: 'hidden' },
  rankBadge: { position: 'absolute', top: 16, left: 14, backgroundColor: '#FAF9F6', paddingHorizontal: 9, paddingVertical: 7 },
  rankText: { fontSize: 9, color: ink, letterSpacing: 1, fontWeight: '700' },
  saveButton: { position: 'absolute', top: 8, right: 8, width: 44, height: 44, backgroundColor: '#FAF9F6', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  saveIcon: { fontSize: 27, color: ink },
  savedIcon: { fontSize: 23 },
  completeBadge: { position: 'absolute', bottom: 34, right: 12, backgroundColor: '#FAF9F6', paddingHorizontal: 9, paddingVertical: 6, maxWidth: '85%' },
  completeText: { color: ink, fontSize: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  lookTitle: { flex: 1, color: ink, fontFamily: 'serif', fontSize: 23 },
  lookNumber: { fontSize: 11, color: '#6A7364' },
  pieceSummary: { color: '#62695F', fontSize: 12, lineHeight: 19, marginTop: 7, minHeight: 38 },
  palette: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 12, marginBottom: 16 },
  swatch: { width: 13, height: 13, borderRadius: 7, borderWidth: 1, borderColor: '#00000012' },
  paletteCaption: { marginLeft: 5, fontSize: 11, color: '#65705F' },
  primary: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: ink, borderRadius: 3 },
  primaryText: { flexShrink: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  primaryArrow: { color: '#FFFFFF', fontSize: 20 },
  detailButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderColor: '#DDE0D5', paddingVertical: 8 },
  link: { fontSize: 12, color: ink, fontWeight: '600', flexShrink: 1 },
  arrowSmall: { fontSize: 20, color: ink },
  details: { paddingTop: 10, gap: 10 },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, borderBottomWidth: 1, borderColor: '#E6E7DF' },
  pieceDot: { width: 28, height: 34, borderRadius: 3, borderWidth: 1, borderColor: '#00000012' },
  pieceCategory: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#6A7364' },
  pieceName: { color: ink, fontSize: 13, marginTop: 4 },
  body: { color: '#596352', fontSize: 12, lineHeight: 19, marginTop: 4 },
  textButton: { minHeight: 44, justifyContent: 'center' },
  notice: { backgroundColor: '#EDF0E4', padding: 16, gap: 5, marginBottom: 16 },
  error: { color: '#8A392C', fontSize: 13, marginBottom: 12 },
  empty: { paddingVertical: 36, gap: 16 },
  moreButton: { minHeight: 50, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#C2CCB7', borderRadius: 3, paddingHorizontal: 26, paddingVertical: 12 },
  footer: { borderTopWidth: 1, borderColor: '#DDE0D5', marginTop: 44, paddingTop: 28, paddingBottom: 12, gap: 8 },
  footerBrand: { fontFamily: 'serif', fontSize: 24, color: ink },
  footerText: { fontSize: 10, color: '#63705D', lineHeight: 17 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
});
