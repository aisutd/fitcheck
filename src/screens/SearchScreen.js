import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import FeaturePage, { ui } from '../components/FeaturePage';
import { useFitCheck } from '../../App';
import { filterWardrobeItems } from '../features/wardrobe/wardrobeModel';
const API = (process.env.EXPO_PUBLIC_SEARCH_API_URL || 'http://localhost:5001').replace(/\/$/, '');
// Category filtering and open-ended AI search from Khushi-SearchScreen share this input.
const categories = ['Party Outfit', 'Traditional', 'Friends Night Out', 'Work / Class', 'Wedding Guest', 'Casual', 'Formal', 'Work', 'Date Night', 'Gym', 'Concert', 'Travel', 'Sleepwear'];
export default function SearchScreen() {
 const { wardrobeState, wardrobeReady } = useFitCheck();
 const [query, setQuery] = useState(''); const [selected, setSelected] = useState(''); const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false); const [error, setError] = useState('');
 const pending = useRef(null);
 useEffect(() => () => pending.current?.abort(), []);
 function edit(value) { pending.current?.abort(); pending.current = null; setLoading(false); setQuery(value); setResult(null); setError(''); }
 async function search() {
  if (!query.trim()) return;
  pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
  setLoading(true); setResult(null); setError(''); const timer = setTimeout(() => controller.abort(), 35000);
  try {
   const response = await fetch(`${API}/api/search-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), signal: controller.signal });
   const payload = await response.json();
   if (!response.ok) throw new Error(payload.error || 'Search failed.');
   if (!Array.isArray(payload.items) || !payload.items.every((item) => typeof item === 'string') || typeof payload.title !== 'string') throw new Error('Invalid search results.');
   if (pending.current === controller) setResult(payload);
  } catch (failure) { if (pending.current === controller) setError(controller.signal.aborted ? 'Search timed out. Please retry.' : failure.message); }
  finally { clearTimeout(timer); if (pending.current === controller) setLoading(false); }
 }
 const matches = wardrobeReady && query.trim() ? filterWardrobeItems(wardrobeState.personalItems, { search: query }) : [];
 function openItem(item) { router.push({ pathname: '/wardrobe', params: { item: item.id } }); }
 return <FeaturePage title="Find Your Next Look">
  <Text style={ui.body}>Search your closet or describe an occasion for an AI outfit idea.</Text>
  <TextInput accessibilityLabel="Search clothing, occasion or style" value={query} onChangeText={edit} onSubmitEditing={search} returnKeyType="search" placeholder="An evening concert, relaxed linen…" maxLength={2000} style={[ui.input, styles.searchInput]} />
  <View style={[ui.row, styles.categories]}>{categories.filter((category) => category.toLowerCase().includes(query.toLowerCase())).map((category) => <Pressable key={category} accessibilityRole="button" style={ui.button} accessibilityState={{ selected: selected === category }} onPress={() => { setSelected(selected === category ? '' : category); edit(category); }}><Text style={ui.link}>{category}</Text></Pressable>)}</View>
  {!categories.some((category) => category.toLowerCase().includes(query.toLowerCase())) ? <Text style={ui.body}>No categories found. You can still search for an outfit idea.</Text> : null}
  {loading ? <ActivityIndicator color="#243528" /> : null}{error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
  {result ? <View style={ui.card}><Text style={ui.title}>{result.title}</Text><Text style={ui.body}>{result.matched_category}</Text>{result.items.map((item, index) => <View key={index}><Text style={ui.body}>{item}</Text><Pressable accessibilityRole="button" style={ui.button} onPress={() => router.push({ pathname: '/shopping', params: { occasion: categories.includes(query) ? query : 'Casual', category: /shoe|boot|sneaker|heel/i.test(item) ? 'shoes' : /pants|trouser|skirt|shorts|jeans/i.test(item) ? 'bottom' : /jacket|coat|cardigan/i.test(item) ? 'layer' : /dress|suit/i.test(item) ? 'onepiece' : /bag|belt|scarf|jewelry/i.test(item) ? 'accessory' : 'top', style: item } })}><Text style={ui.link}>Shop this idea →</Text></Pressable></View>)}<Text style={ui.body}>{result.styling_tip}</Text></View> : null}
  {query.trim() ? <Text style={ui.body}>{matches.length} matching pieces in your personal wardrobe</Text> : null}
  {matches.map((item) => <Pressable accessibilityRole="button" key={item.id} onPress={() => openItem(item)} style={ui.card}><Text style={ui.link}>{item.name}</Text><Text style={ui.body}>{item.color} · {item.category}</Text></Pressable>)}
 </FeaturePage>;
}

const styles = StyleSheet.create({
 searchInput: { width: '100%', alignSelf: 'center', textAlign: 'center' },
 categories: { justifyContent: 'center' },
});
