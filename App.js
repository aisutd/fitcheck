import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  orange: '#FF8243',
  teal: '#069494',
  background: '#F9F8F6',
  cardBg: '#FFFFFF',
  textDark: '#1A2E2B',
  textLight: '#6B7A77',
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Updated AI Search Handler
  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setAiResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/search-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server Error Response:', errorText);
        Alert.alert('Server Error', 'Check backend terminal logs for details.');
        return;
      }

      const data = await response.json();
      console.log('AI Response Data:', data);
      setAiResult(data);
    } catch (error) {
      console.error('AI Search Error:', error);
      Alert.alert('Connection Error', 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subHeading}>AI OUTFIT FINDER</Text>
          <Text style={styles.title}>What Will You Wear Today?</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.teal} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Describe your event, vibe, or style..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleAiSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setAiResult(null); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 40 }} />
        )}

        {/* Placeholder Graphic / Illustration using local rack.png */}
        {!aiResult && !loading && (
          <View style={styles.illustrationContainer}>
            <Image
              source={require('./assets/rack.png')}
              style={styles.rackImage}
              resizeMode="contain"
            />
            <Text style={styles.illustrationTitle}>Your Virtual Wardrobe</Text>
            <Text style={styles.illustrationText}>
              Type a style, vibe, or occasion above and let AI curate your perfect rack!
            </Text>
          </View>
        )}

        {/* AI Results Section */}
        {aiResult && !loading && (
          <View style={styles.resultContainer}>
            <View style={styles.aiBanner}>
              <Ionicons name="sparkles" size={18} color={COLORS.orange} />
              <Text style={styles.aiText}>
                Category:{' '}
                <Text style={{ fontWeight: '800' }}>
                  {aiResult.matched_category}
                </Text>
              </Text>
            </View>

            <View style={styles.recommendationCard}>
              <Text style={styles.recTitle}>{aiResult.title || "Recommended Outfit"}</Text>
              
              <Text style={{ fontWeight: '700', color: COLORS.teal, marginTop: 12, marginBottom: 6 }}>
                Suggested Pieces:
              </Text>
              {aiResult.items && aiResult.items.map((item, index) => (
                <Text key={index} style={{ fontSize: 14, color: COLORS.textDark, marginBottom: 4 }}>
                  • {item}
                </Text>
              ))}

              <Text style={{ fontWeight: '700', color: COLORS.orange, marginTop: 14, marginBottom: 4 }}>
                Styling Tip:
              </Text>
              <Text style={styles.recDescription}>
                {aiResult.styling_tip}
              </Text>
            </View>
          </View>
        )}

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  header: { marginBottom: 24 },
  subHeading: { fontSize: 12, fontWeight: '700', color: COLORS.orange, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.teal, lineHeight: 34 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08,
    shadowRadius: 10, elevation: 3, borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textDark },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  rackImage: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  illustrationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.teal,
    marginBottom: 8,
  },
  illustrationText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultContainer: { marginTop: 30 },
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3EC',
    padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFD7C2',
  },
  aiText: { marginLeft: 8, fontSize: 14, color: COLORS.textDark },
  recommendationCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#EFEFEF',
  },
  recTitle: { fontSize: 12, fontWeight: '700', color: COLORS.orange, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  recCategory: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginBottom: 12 },
  recDescription: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
});