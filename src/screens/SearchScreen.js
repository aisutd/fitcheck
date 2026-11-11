import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import FeaturePage, { ui } from '../components/FeaturePage';
import { useFitCheck } from '../../App';
import { INSPIRATIONS, matchInspiration } from '../features/search/inspiration';
import { OCCASIONS } from '../features/suggest/occasions';
const API = (process.env.EXPO_PUBLIC_SEARCH_API_URL || '').replace(/\/$/, '');
// Category filtering and open-ended AI search from Khushi-SearchScreen share this input.
const categories = OCCASIONS;
export default function SearchScreen() {
 const { wardrobeState, wardrobeReady } = useFitCheck();
 const [query, setQuery] = useState(''); const [selected, setSelected] = useState(''); const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false); const [error, setError] = useState('');
 const [inspiration, setInspiration] = useState(null);
 const pending = useRef(null);
 useEffect(() => () => pending.current?.abort(), []);
 function edit(value) { pending.current?.abort(); pending.current = null; setLoading(false); setQuery(value); setResult(null); setError(''); }
 async function search() {
  if (!query.trim()) return;
  if (!API) { setError('AI ideas need a connected service. Explore the curated briefs and your wardrobe matches below meanwhile.'); return; }
  pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
  setLoading(true); setResult(null); setError(''); const timer = setTimeout(() => controller.abort(), 35000);
  try {
   const response = await fetch(`${API}/api/search-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: selected ? `${selected}: ${query}` : query }), signal: controller.signal });
   const payload = await response.json();
   if (!response.ok) throw new Error(payload.error || 'Search failed.');
   if (!Array.isArray(payload.items) || !payload.items.every((item) => typeof item === 'string') || typeof payload.title !== 'string') throw new Error('Invalid search results.');
   if (pending.current === controller) setResult(payload);
  } catch (failure) { if (pending.current === controller) setError(controller.signal.aborted ? 'Search timed out. Please retry.' : failure.message); }
  finally { clearTimeout(timer); if (pending.current === controller) setLoading(false); }
 }
 const matches = wardrobeReady ? matchInspiration(wardrobeState.personalItems, { query, occasion: selected, inspiration }) : [];
 function openItem(item) { router.push({ pathname: '/wardrobe', params: { item: item.id } }); }
 return <FeaturePage title="Find your next look.">
  <Text style={ui.body}>Find pieces you already own, choose an occasion, or start with a creator-inspired style brief.</Text>
  <TextInput accessibilityLabel="Search clothing, occasion or style" value={query} onChangeText={(value) => { setInspiration(null); edit(value); }} placeholder="Describe a look or paste a caption…" multiline maxLength={2000} style={ui.input} />
  <View style={ui.row}>{categories.map(category => <Pressable key={category} accessibilityRole="button" accessibilityState={{ selected: selected === category }} style={[ui.button, selected === category && { backgroundColor: '#F3EDFC', borderColor: '#7040B8' }]} onPress={() => { setSelected(selected === category ? '' : category); setResult(null); }}><Text style={ui.link}>{category}</Text></Pressable>)}</View>
  <Text style={ui.body}>More style prompts</Text>
  <View style={ui.row}>{['Party Outfit', 'Traditional', 'Friends Night Out', 'Work / Class', 'Wedding Guest'].map(prompt => <Pressable key={prompt} accessibilityRole="button" style={ui.button} onPress={() => { setInspiration(null); setSelected(''); edit(prompt); }}><Text style={ui.link}>{prompt}</Text></Pressable>)}</View>
  <Text accessibilityRole="header" style={ui.title}>A starting point.</Text>
  <Text style={ui.body}>Editorial inspiration from public style stories. These creators are not affiliated with FitCheck.</Text>
  {INSPIRATIONS.map(idea => <View key={idea.id} style={[ui.card, inspiration?.id === idea.id && { borderColor: '#7040B8' }]}><Text style={ui.link}>{idea.title} · {idea.creator}</Text><Text style={ui.body}>{idea.brief}</Text><View style={ui.row}><Pressable accessibilityRole="button" style={ui.button} onPress={() => { edit(idea.brief); setInspiration(idea); }}><Text style={ui.link}>Try this direction</Text></Pressable><Pressable accessibilityRole="link" style={ui.button} onPress={() => Linking.openURL(idea.source).catch(() => setError('Could not open the source. Please try again.'))}><Text style={ui.link}>Read source ↗</Text></Pressable></View></View>)}
  <Pressable accessibilityRole="button" disabled={loading || !query.trim()} onPress={search} style={[ui.button, (loading || !query.trim()) && ui.disabled]}><Text style={ui.link}>Create an outfit idea</Text></Pressable>
  <Text style={ui.body}>AI search sends your search text to Groq. Generated suggestions are ideas, not items confirmed in your wardrobe.</Text>
  {loading ? <ActivityIndicator color="#171717" /> : null}{error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
  {result ? <View style={ui.card}><Text style={ui.title}>{result.title}</Text><Text style={ui.body}>{result.matched_category}</Text>{result.items.map((item, index) => <View key={index}><Text style={ui.body}>{item}</Text><Pressable accessibilityRole="button" style={ui.button} onPress={() => router.push({ pathname: '/shopping', params: { occasion: selected || 'Casual', category: /shoe|boot|sneaker|heel/i.test(item) ? 'shoes' : /pants|trouser|skirt|shorts|jeans/i.test(item) ? 'bottom' : /jacket|coat|cardigan/i.test(item) ? 'layer' : /dress|suit/i.test(item) ? 'onepiece' : /bag|belt|scarf|jewelry/i.test(item) ? 'accessory' : 'top', style: item } })}><Text style={ui.link}>Shop this idea →</Text></Pressable></View>)}<Text style={ui.body}>{result.styling_tip}</Text></View> : null}
  <Text accessibilityRole="header" style={ui.link}>{matches.length} available matches in your personal wardrobe</Text>{!matches.length ? <Text style={ui.body}>No available pieces match these filters yet. Add pieces or try a different style or occasion.</Text> : null}
  {matches.map((item) => <Pressable accessibilityRole="button" key={item.id} onPress={() => openItem(item)} style={ui.card}><Text style={ui.link}>{item.name}</Text><Text style={ui.body}>{item.color} · {item.category}</Text></Pressable>)}
 </FeaturePage>;
}
