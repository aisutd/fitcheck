import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { OCCASIONS, WARDROBE, recommendOutfit } = require('../features/suggest/outfitRecommendations');

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

export default function SuggestScreen() {
  const [occasion, setOccasion] = useState('Work');
  const [attempt, setAttempt] = useState(0);
  const [outfit, setOutfit] = useState(() => recommendOutfit('Work'));

  function selectOccasion(nextOccasion) {
    setOccasion(nextOccasion);
    setAttempt(0);
    setOutfit(recommendOutfit(nextOccasion));
  }

  function generateAnotherOutfit() {
    if (outfit.items.length === 0) return;

    const nextAttempt = attempt + 1;
    setOutfit(
      recommendOutfit(
        occasion,
        WARDROBE,
        outfit.items.map((item) => item.id),
        nextAttempt,
      ),
    );
    setAttempt(nextAttempt);
  }

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
              <Text style={styles.wardrobeText}>YOUR WARDROBE</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>THE DAILY EDIT</Text>
            <Text style={styles.title}>
              Style Your{'\n'}Day<Text style={styles.titlePeriod}>.</Text>
            </Text>
            <Text style={styles.subtitle}>
              A fresh outfit, thoughtfully put together from pieces you own.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>WHAT'S THE OCCASION?</Text>
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
              <Text style={styles.recommendationNote}>{OCCASION_NOTES[occasion]}</Text>
            </View>
            <View style={styles.lookNumber}>
              <Text style={styles.lookNumberText}>{String(attempt + 1).padStart(2, '0')}</Text>
            </View>
          </View>

          {outfit.items.length > 0 ? (
            <>
              <View style={styles.featureCard}>
                <View style={styles.featureTopLine}>
                  <Text style={styles.featureEyebrow}>FITCHECK PICK</Text>
                  <View style={styles.readyBadge}>
                    <View style={styles.readyDot} />
                    <Text style={styles.readyText}>READY TO WEAR</Text>
                  </View>
                </View>
                <Text style={styles.featureTitle}>{occasion}, reworked.</Text>
                <Text style={styles.featureCaption}>
                  {outfit.items.length} pieces, one considered look.
                </Text>
                <View style={styles.paletteRow}>
                  {outfit.items.map((item) => (
                    <View key={item.id} style={styles.paletteItem}>
                      <View
                        style={[
                          styles.paletteSwatch,
                          { backgroundColor: item.colorHex },
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
                <Text style={styles.pieceCount}>{outfit.items.length} ITEMS</Text>
              </View>

              <View style={styles.pieceList}>
                {outfit.items.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.pieceRow, index === outfit.items.length - 1 && styles.lastPieceRow]}
                  >
                    <View
                      style={[
                        styles.pieceSwatch,
                        { backgroundColor: item.colorHex },
                        item.colorHex === '#F4F4EF' && styles.lightSwatch,
                      ]}
                    />
                    <View style={styles.pieceCopy}>
                      <Text style={styles.pieceCategory}>{item.category}</Text>
                      <Text style={styles.pieceName}>{item.name}</Text>
                    </View>
                    <Text style={styles.pieceColor}>{item.color}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>A look needs a few more pieces.</Text>
              <Text style={styles.emptyMessage}>{outfit.message}</Text>
            </View>
          )}

          {outfit.message !== '' && outfit.items.length > 0 ? (
            <Text style={styles.inlineMessage}>{outfit.message}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: outfit.items.length === 0 }}
            disabled={outfit.items.length === 0}
            onPress={generateAnotherOutfit}
            style={({ pressed }) => [
              styles.generateButton,
              outfit.items.length === 0 && styles.generateButtonDisabled,
              pressed && outfit.items.length > 0 && styles.generateButtonPressed,
            ]}
          >
            <Text style={styles.generateButtonText}>Generate Another Outfit</Text>
            <Text style={styles.generateButtonIcon}>↻</Text>
          </Pressable>
          <Text style={styles.footerNote}>BUILT ONLY FROM YOUR FITCHECK WARDROBE</Text>
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
  lookNumber: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E1E9DC',
  },
  lookNumberText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  featureCard: { padding: 18, borderRadius: 8, backgroundColor: colors.green },
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