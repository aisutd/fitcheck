import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { Image, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import AvatarModel from './AvatarFigure';
import { quizAvatarPreview } from '../quiz/quizAvatarPreview';
import { carouselWindow, nextCarouselId, QUIZ_SHOPPING } from '../quiz/carouselModel';
import { searchShopping } from '../shopping/shoppingClient';
import { safeHttps } from '../shopping/shoppingModel';

class PreviewBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function QuizAvatarPreview({ answers, questionId, customization, group, onChoose }) {
  const { fontScale } = useWindowDimensions();
  const selected = answers[questionId]?.[group.id] || [];
  const [focusedId, setFocusedId] = useState(() => selected[selected.length - 1] || group.options[0].id);
  const [width, setWidth] = useState(300);
  const clothing = quizAvatarPreview(answers, questionId, focusedId);
  const focused = group.options.find((option) => option.id === focusedId) || group.options[0];
  const [yaw, setYaw] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [examples, setExamples] = useState({});
  const [loading, setLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const request = useRef(null);
  const liveAvailable = Boolean(process.env.EXPO_PUBLIC_SHOPPING_API_URL);
  const product = examples[focusedId];
  const selectionFull = !selected.includes(focusedId) && selected.length >= group.max;
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  useEffect(() => {
    if (ready || failed) return undefined;
    const timer = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timer);
  }, [ready, failed, attempt]);
  function focus(id) {
    request.current?.abort(); request.current = null;
    setLoading(false); setShoppingError(''); setFocusedId(id);
  }
  async function loadExample() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const choiceId = focusedId;
    setLoading(true); setShoppingError('');
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const result = await searchShopping({ occasion: 'Casual', category: QUIZ_SHOPPING[choiceId].category, quizChoice: choiceId, maxPrice: null }, controller.signal);
      if (request.current === controller && !controller.signal.aborted) {
        const example = result.products.find((item) => item.image) || result.products[0];
        if (example) setExamples((current) => ({ ...current, [choiceId]: { ...example, fetchedAt: result.fetchedAt } }));
        else setShoppingError('No shopping example found for this idea. You can still select the illustrated answer.');
      }
    } catch (error) {
      if (request.current === controller) setShoppingError(controller.signal.aborted ? 'Shopping search timed out. Try again.' : error.message);
    } finally {
      clearTimeout(timer);
      if (request.current === controller) setLoading(false);
    }
  }
  async function openExample() {
    const url = safeHttps(product?.url);
    if (!url) return;
    try { await Linking.openURL(url); } catch { setShoppingError('The shopping link could not be opened.'); }
  }
  const fallback = <View style={styles.fallback}><Text style={styles.copy}>3D preview unavailable. Your selections still work.</Text></View>;
  const cardWidth = Math.min(112, width * 0.3);
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>YOUR STYLE, IN ORBIT</Text>
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.orbit, { height: Math.max(365, 260 + 110 * fontScale) }]}>
      <View accessibilityRole="image" accessibilityLabel={`Illustrative avatar preview: ${clothing.label}`} style={styles.stage}>
        {failed ? fallback : <PreviewBoundary key={attempt} onError={() => setFailed(true)} fallback={fallback}>
          <Canvas dpr={1} frameloop="demand" camera={{ position: [0, 0.1, 5.1], fov: 34 }} gl={{ antialias: false, powerPreference: 'low-power' }}
            onCreated={({ gl }) => { gl.setClearColor('#E8EDE6', 1); setReady(true); }}>
            <ambientLight intensity={1.8} />
            <directionalLight position={[3, 4, 5]} intensity={2.2} />
            <AvatarModel customization={customization} yaw={yaw} segments={10} clothing={clothing} />
          </Canvas>
        </PreviewBoundary>}
      </View>
      {carouselWindow(group.options, focusedId).map(({ option, offset }) => {
        const example = examples[option.id];
        return <Pressable key={option.id} accessibilityRole="button"
          accessibilityLabel={`Preview ${option.label}${selected.includes(option.id) ? ', already selected as an answer' : ''}`}
          accessibilityHint="Changes the preview only. Use Add to answers to confirm this choice."
          onPress={() => focus(option.id)}
          style={[styles.orbitItem, { width: cardWidth, left: width / 2 - cardWidth / 2 + offset * width * 0.33, top: offset === 0 ? 245 : 170 }, offset === 0 && styles.orbitFocus]}>
          {example?.image && !imageErrors[option.id] ? <Image source={{ uri: example.image }} style={styles.productImage} resizeMode="contain" accessible={false}
            onError={() => setImageErrors((current) => ({ ...current, [option.id]: true }))} /> :
            <Text accessible={false} style={styles.symbol}>{option.id.includes('shorts') ? '🩳' : QUIZ_SHOPPING[option.id].category === 'layer' ? '🧥' : '👕'}</Text>}
          <Text numberOfLines={2} style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.kind}>{example?.image && !imageErrors[option.id] ? 'SHOPPING EXAMPLE' : 'ILLUSTRATED IDEA'}{selected.includes(option.id) ? ' · ✓' : ''}</Text>
        </Pressable>;
      })}
    </View>
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous outfit idea" onPress={() => focus(nextCarouselId(group.options, focusedId, -1))} style={styles.button}><Text style={styles.buttonText}>← Previous</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Next outfit idea" onPress={() => focus(nextCarouselId(group.options, focusedId, 1))} style={styles.button}><Text style={styles.buttonText}>Next →</Text></Pressable>
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.caption}>{focused.label} · {group.options.findIndex((option) => option.id === focusedId) + 1} of {group.options.length}</Text>
    <Text style={styles.copy}>{focused.detail}</Text>
    <Text accessibilityLiveRegion="polite" style={styles.copy}>Selected answers · {selected.length} of {group.max}: {selected.length ? group.options.filter((option) => selected.includes(option.id)).map((option) => option.label).join(', ') : 'None yet'}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${selected.includes(focusedId) ? 'Remove' : 'Add'} ${focused.label} ${selected.includes(focusedId) ? 'from' : 'to'} answers`}
      disabled={selectionFull} accessibilityState={{ disabled: selectionFull }}
      onPress={() => onChoose(group, focused)} style={[styles.confirm, selectionFull && { opacity: 0.6 }]}><Text style={styles.confirmText}>{selected.includes(focusedId) ? 'Remove from answers' : selectionFull ? 'Remove a choice to add this' : 'Add to answers'}</Text></Pressable>
    <Text style={styles.copy}>Browse freely; only Add to answers changes your selections. Choose up to two. The avatar is illustrative, not an exact garment fit.</Text>
    <View style={styles.controls}>
      {failed ? <Pressable accessibilityRole="button" style={styles.button} onPress={() => { setFailed(false); setReady(false); setAttempt((value) => value + 1); }}><Text style={styles.buttonText}>Retry 3D</Text></Pressable> : <>
        <Pressable accessibilityRole="button" accessibilityLabel="Turn avatar left" style={styles.button} onPress={() => setYaw((value) => value - Math.PI / 4)}><Text style={styles.buttonText}>Turn left</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Turn avatar right" style={styles.button} onPress={() => setYaw((value) => value + Math.PI / 4)}><Text style={styles.buttonText}>Turn right</Text></Pressable>
      </>}
    </View>
    {liveAvailable ? <Pressable accessibilityRole="button" disabled={loading} accessibilityState={{ disabled: loading }} onPress={loadExample} style={styles.button}><Text style={styles.buttonText}>{loading ? 'Finding an example…' : 'Load a real shopping example'}</Text></Pressable> : <Text style={styles.copy}>Live shopping examples are not connected yet. Illustrated ideas remain available.</Text>}
    {shoppingError ? <Text accessibilityRole="alert" style={styles.error}>{shoppingError}</Text> : null}
    {product ? <Pressable accessibilityRole="link" onPress={openExample} style={styles.example}>
      <Text style={styles.buttonText}>{product.title} ↗</Text>
      <Text style={styles.copy}>{product.retailer} · ${product.price.toFixed(2)} USD · Google Shopping via SerpApi</Text>
      <Text style={styles.copy}>Illustrates one piece, not the whole outfit. Retrieved {new Date(product.fetchedAt).toLocaleString()}; verify price and availability on the shopping page. Opening it does not select a quiz answer.</Text>
    </Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#DCE3DC', backgroundColor: '#FAFBF8', padding: 12, marginVertical: 14 },
  eyebrow: { color: '#627A68', letterSpacing: 1.2, fontSize: 9, fontWeight: '800', marginBottom: 10 },
  orbit: { height: 365, backgroundColor: '#E8EDE6', borderRadius: 10, overflow: 'hidden' },
  stage: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  orbitItem: { position: 'absolute', minHeight: 96, borderRadius: 10, padding: 7, borderWidth: 1, borderColor: '#DCE3DC', backgroundColor: '#FAFBF8', alignItems: 'center' },
  orbitFocus: { borderColor: '#27483C', borderWidth: 2 }, symbol: { fontSize: 28, marginBottom: 4 },
  optionLabel: { fontSize: 11, lineHeight: 14, color: '#202B27', textAlign: 'center', fontWeight: '700' },
  kind: { fontSize: 7, color: '#627A68', marginTop: 5, textAlign: 'center' }, productImage: { width: 65, height: 44, marginBottom: 4 },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  caption: { color: '#27483C', fontSize: 13, fontWeight: '700', marginTop: 10 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 },
  button: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#DCE3DC' },
  buttonText: { color: '#27483C', fontSize: 12, fontWeight: '700' },
  confirm: { minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#27483C', borderRadius: 8, marginVertical: 10 },
  confirmText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  copy: { color: '#6C7771', fontSize: 11, lineHeight: 17 }, error: { color: '#9B3F35', fontSize: 12, marginVertical: 10 },
  example: { padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#DCE3DC', borderRadius: 8 },
});
