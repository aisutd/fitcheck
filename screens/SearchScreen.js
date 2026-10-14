import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Caveat_700Bold } from '@expo-google-fonts/caveat';

const COLORS = {
  orange: '#FF8243',
  pink: '#FFC0C8',
  yellow: '#FCE883',
  teal: '#069494',
  white: '#FFFFFF',
  dark: '#1F2D2D',
};

// Repeating 1-2-3-4 color pattern for the tiles
const PATTERN = [
  { bg: COLORS.orange, text: COLORS.white },
  { bg: COLORS.pink, text: COLORS.dark },
  { bg: COLORS.yellow, text: COLORS.dark },
  { bg: COLORS.teal, text: COLORS.white },
];

const CATEGORIES = [
  { id: '1', label: 'Party Outfit', emoji: '🎉' },
  { id: '2', label: 'Traditional', emoji: '🪔' },
  { id: '3', label: 'Friends Night Out', emoji: '🥂' },
  { id: '4', label: 'Date Night', emoji: '💃' },
  { id: '5', label: 'Casual', emoji: '👟' },
  { id: '6', label: 'Work / Class', emoji: '🎒' },
  { id: '7', label: 'Wedding Guest', emoji: '💐' },
  { id: '8', label: 'Travel', emoji: '✈️' },
];

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { id: 'explore', label: 'Explore', icon: 'compass-outline', iconActive: 'compass', active: true },
  { id: 'wardrobe', label: 'My Wardrobe', icon: 'shirt-outline', iconActive: 'shirt' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export default function SearchScreen() {
  const [fontsLoaded] = useFonts({ Caveat_700Bold });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  if (!fontsLoaded) return null;

  const filtered = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>What Will You Wear Today?</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.teal} />
          <TextInput
            style={styles.input}
            placeholder="Search outfits, occasions..."
            placeholderTextColor="#7A8B8B"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#7A8B8B" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.grid}>
          {filtered.map((c, index) => {
            const color = PATTERN[index % PATTERN.length];
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelected(c.id);
                  Alert.alert(
                    c.label,
                    `This button will take you to the ${c.label} screen`
                  );
                }}
                style={[
                  styles.tile,
                  { backgroundColor: color.bg },
                  selected === c.id && styles.tileSelected,
                ]}
              >
                <Text style={styles.emoji}>{c.emoji}</Text>
                <Text style={[styles.tileLabel, { color: color.text }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <Text style={styles.empty}>No categories found</Text>
          )}
        </View>
      </ScrollView>
            <View style={styles.navBar}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                item.label,
                `This button will take you to the ${item.label} screen`
              )
            }
          >
            <Ionicons
              name={item.active ? item.iconActive : item.icon}
              size={26}
              color={item.active ? COLORS.teal : '#7A8B8B'}
            />
            <Text
              style={[
                styles.navLabel,
                { color: item.active ? COLORS.teal : '#7A8B8B' },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Caveat_700Bold',
    color: COLORS.teal,
    textAlign: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3EFEF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#5FBDBD',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.dark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    height: 150,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  tileSelected: {
    borderWidth: 3,
    borderColor: COLORS.dark,
  },
  emoji: { fontSize: 36 },
  tileLabel: { fontSize: 18, fontWeight: '700' },
    navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderTopWidth: 1.5,
    borderTopColor: '#5FBDBD',
    paddingTop: 8,
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  empty: {
    width: '100%',
    textAlign: 'center',
    color: '#7A8B8B',
    marginTop: 40,
    fontSize: 16,
  },
});