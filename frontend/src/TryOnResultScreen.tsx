import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTryOnResult } from './TryOnResultContext';
export default function TryOnResultScreen() {
  const { result } = useTryOnResult();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to uploads" onPress={back} style={s.back}><Text style={s.arrow}>‹</Text></Pressable><Text style={s.title}>Your Try-On</Text><View style={{ width: 44 }} /></View>
    <Text style={s.notice}>AI-generated with IDM-VTON · Results may vary</Text>
    <View style={s.viewport}>
      {result ? <Image source={{ uri: result.uri }} resizeMode="contain" style={StyleSheet.absoluteFill} accessibilityLabel="Your AI-generated virtual try-on image" onLoadEnd={() => setLoading(false)} onError={() => { setLoading(false); setError('The generated image could not be displayed. Please try again.'); }} /> : <Text style={s.empty}>No generated look in this session. Upload both photos to get started.</Text>}
      {result && loading && <ActivityIndicator color="#5A4C60" />}
      {!!error && <Text accessibilityLiveRegion="polite" style={s.empty}>{error}</Text>}
    </View>
    <View style={s.actions}><Pressable accessibilityRole="button" onPress={back} style={[s.action, { backgroundColor: '#E9DCCB' }]}><Text style={s.secondary}>Try Another</Text></Pressable></View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF7F0' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 }, back: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, arrow: { color: '#5A4C60', fontSize: 28 }, title: { fontSize: 23, color: '#5A4C60', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }, notice: { textAlign: 'center', color: '#756A79', fontSize: 11, paddingBottom: 16, paddingHorizontal: 20 }, viewport: { flex: 1, minHeight: 220, marginHorizontal: 16, backgroundColor: '#FFFEFC', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E9DCCB', alignItems: 'center', justifyContent: 'center' }, empty: { color: '#5A4C60', fontSize: 14, lineHeight: 22, textAlign: 'center', padding: 24 }, actions: { flexDirection: 'row', gap: 12, padding: 20, maxWidth: 650, width: '100%', alignSelf: 'center' }, action: { flex: 1, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, secondary: { color: '#5A4C60', fontWeight: '600' }, primary: { color: '#FBF7F0', fontWeight: '600' }, message: { textAlign: 'center', color: '#5A4C60', fontSize: 12, paddingBottom: 12 },
});
