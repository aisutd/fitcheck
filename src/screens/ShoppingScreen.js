import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchShopping } from '../features/shopping/shoppingClient';
import { SHOP_CATEGORIES, safeHttps } from '../features/shopping/shoppingModel';

export default function ShoppingScreen({ occasion, initialCategory, style = '', missing = [], onClose }) {
  const [category, setCategory] = useState(Object.prototype.hasOwnProperty.call(SHOP_CATEGORIES, initialCategory) ? initialCategory : 'layer');
  const [budget, setBudget] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const requestRef = useRef(null);
  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  function clearResults() {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
    setResult(null);
    setError('');
  }
  async function search() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    setResult(null);
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const data = await searchShopping({ occasion, category, style, maxPrice: budget }, controller.signal);
      if (requestRef.current === controller && !controller.signal.aborted) {
        setResult(data);
        setImageErrors({});
      }
    } catch (failure) {
      if (requestRef.current === controller) {
        setError(controller.signal.aborted ? 'Search timed out. Please try again.' : failure.message);
      }
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) setLoading(false);
    }
  }
  async function openProduct(product) {
    const url = safeHttps(product.url);
    if (!url) { setError('This product link is unavailable.'); return; }
    try { await Linking.openURL(url); }
    catch { setError('The product link could not be opened. Please try another product.'); }
  }
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>FITCHECK · THE EDIT</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.back}><Text style={styles.backText}>Back to outfits</Text></Pressable>
        </View>
        <Text accessibilityRole="header" style={styles.title}>The finishing touch.</Text>
        <Text style={styles.intro}>{occasion} · {missing.includes(category) ? 'Find a missing piece for this look.' : 'Explore an optional alternative for this look.'}</Text>
        <Text style={styles.note}>Shopping suggestions · not in your wardrobe</Text>
        <Text style={styles.label}>THE PIECE</Text>
        <View style={styles.choices}>
          {Object.entries(SHOP_CATEGORIES).map(([id, label]) => (
            <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: category === id }}
              onPress={() => { clearResults(); setCategory(id); }} style={[styles.chip, category === id && styles.selected]}>
              <Text style={[styles.chipText, category === id && styles.selectedText]}>{label}{missing.includes(id) ? ' · missing' : ''}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>MAXIMUM PER ITEM · USD</Text>
        <TextInput accessibilityLabel="Maximum price per item in US dollars, optional" keyboardType="decimal-pad"
          placeholder="Any price" placeholderTextColor="#6C7771" value={budget}
          onChangeText={(value) => { clearResults(); setBudget(value); }} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} onPress={search} style={styles.search}>
          <Text style={styles.selectedText}>{loading ? 'Finding your edit…' : 'Find pieces'}</Text>
        </Pressable>
        <Text style={styles.note}>Search sends this occasion, category and selected style to our shopping provider. Your photos and full quiz answers stay on your device.</Text>
        {loading ? <ActivityIndicator accessibilityLabel="Loading shopping results" color="#27483C" style={styles.space} /> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {result ? <>
          <Text accessibilityLiveRegion="polite" style={styles.label}>{result.products.length} PIECES · GOOGLE SHOPPING VIA SERPAPI</Text>
          {!result.products.length ? <Text style={styles.intro}>No pieces found within these choices. Try a different category or a higher maximum price.</Text> : null}
          <View style={styles.grid}>
            {result.products.map((product) => (
              <Pressable key={product.id} accessibilityRole="link" accessibilityLabel={`${product.title}, ${product.price} US dollars, ${product.retailer}. Opens an external shopping page.`}
                onPress={() => openProduct(product)} style={styles.product}>
                {product.image && !imageErrors[product.id] ?
                  <Image accessible={false} source={{ uri: product.image }} resizeMode="contain" style={styles.image}
                    onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))} /> :
                  <View style={[styles.image, styles.placeholder]}><Text style={styles.note}>Image unavailable</Text></View>}
                <Text style={styles.retailer}>{product.retailer}</Text>
                <Text numberOfLines={3} style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.price}>${product.price.toFixed(2)} <Text style={styles.note}>USD ↗</Text></Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.note}>Retrieved {new Date(result.fetchedAt).toLocaleString()}. Prices and availability may change. Shipping and tax may be extra; confirm details on the linked shopping page.</Text>
        </> : !loading && !error ? <Text style={styles.intro}>A considered addition, when you need one. Choose a piece and search to see current listings.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F1F4EF' }, content: { width: '100%', maxWidth: 650, alignSelf: 'center', padding: 22, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  eyebrow: { fontSize: 10, color: '#627A68', letterSpacing: 1.4, fontWeight: '800' },
  back: { minHeight: 44, justifyContent: 'center' }, backText: { fontSize: 12, color: '#27483C', fontWeight: '700' },
  title: { fontFamily: 'serif', fontSize: 38, color: '#202B27', marginTop: 22 },
  intro: { fontSize: 14, lineHeight: 22, color: '#6C7771', marginVertical: 12 },
  note: { fontSize: 11, lineHeight: 17, color: '#6C7771' },
  label: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: '#27483C', marginTop: 24, marginBottom: 10 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, borderColor: '#DCE3DC' },
  chipText: { color: '#27483C', fontSize: 12 }, selected: { backgroundColor: '#27483C' }, selectedText: { color: '#FFFFFF', fontWeight: '700' },
  input: { minHeight: 48, borderBottomWidth: 1, borderColor: '#A4B3A5', color: '#202B27', fontSize: 20, paddingVertical: 8 },
  search: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#27483C', marginVertical: 18 },
  space: { margin: 20 }, error: { color: '#9B3F35', paddingVertical: 16, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 },
  product: { width: '48%', minWidth: 120 }, image: { width: '100%', aspectRatio: 0.8, backgroundColor: '#FFFFFF', borderRadius: 8 },
  placeholder: { alignItems: 'center', justifyContent: 'center' }, retailer: { fontSize: 10, color: '#627A68', marginTop: 12 },
  productTitle: { fontSize: 14, lineHeight: 20, color: '#202B27', marginTop: 5 }, price: { fontSize: 14, color: '#27483C', marginTop: 9, marginBottom: 8 },
});
