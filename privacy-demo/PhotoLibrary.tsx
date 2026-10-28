import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import { privacyRequest, resetPrivacyScreen } from './lib/privacyApi';
import { visibilityError } from './lib/closetVisibility';

type Photo = { id: string; category: string; created_at: string; expires_at: string | null; original_present: number; preview_present: number; processing_mode: string };
const button = { paddingVertical: 12, paddingHorizontal: 8 };
const label = { color: '#36009C', fontWeight: '600' as const };

export function PhotoLibrary({ onCount }: { onCount: (count: number) => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [message, setMessage] = useState('Loading your stored photos...');
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState('bodyPhotos');
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [remove, setRemove] = useState<Photo | null>(null);
  const urls = useRef<string[]>([]);
  const mounted = useRef(true);
  async function load() {
    try {
      const body = await (await privacyRequest('/privacy/photos')).json();
      if (!mounted.current) return;
      setPhotos(body.photos); onCount(body.photos.length);
      setMessage(body.cleanup || 'Your photos are private to your account.');
    } catch (error) { if (mounted.current) setMessage(visibilityError(error)); }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = setInterval(() => { void load(); }, 15000);
    return () => { mounted.current = false; clearInterval(timer); urls.current.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  async function upload(file: File) {
    setBusy(true); setMessage('Uploading and processing your photo...');
    try {
      await privacyRequest(`/privacy/photos?category=${category}`, { method: 'POST', body: file });
      resetPrivacyScreen();
    } catch (error) { setMessage(visibilityError(error)); }
    finally { setBusy(false); }
  }
  async function preview(photo: Photo) {
    try {
      const blob = await (await privacyRequest(`/privacy/photos/${photo.id}/preview`)).blob();
      const url = URL.createObjectURL(blob); urls.current.push(url);
      setPreviews(previous => ({ ...previous, [photo.id]: url }));
    } catch (error) { setMessage(visibilityError(error)); }
  }
  async function deletePhoto() {
    if (!remove || busy) return;
    setBusy(true);
    try {
      await privacyRequest(`/privacy/photos/${remove.id}`, { method: 'DELETE' });
      resetPrivacyScreen();
    } catch (error) { setMessage(visibilityError(error)); }
    finally { setBusy(false); }
  }
  return <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 22, marginBottom: 14 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#29233F' }}>Your stored photos</Text>
    <Text style={{ marginTop: 8, color: '#837C96' }}>Upload a sample JPEG or PNG (up to 8 MB). The server creates a preview, then applies your original-photo retention choice.</Text>
    <Text accessibilityLiveRegion="polite" style={{ marginTop: 12, color: '#534FA5' }}>{message}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
      {(['bodyPhotos', 'tryOns', 'closet'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === category }} disabled={busy} style={button} onPress={() => setCategory(value)}><Text style={[label, { opacity: category === value ? 1 : 0.5 }]}>{value === 'bodyPhotos' ? 'Body photo' : value === 'tryOns' ? 'Try-on image' : 'Closet image'}</Text></Pressable>)}
    </View>
    {Platform.OS === 'web' ? React.createElement('input', {
      type: 'file', accept: 'image/jpeg,image/png', disabled: busy,
      'aria-label': 'Upload a sample photo', style: { marginTop: 12, maxWidth: '100%' },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (file) void upload(file);
      },
    }) : <Text>Upload sample photos using the browser preview.</Text>}
    <Text style={{ fontSize: 11, marginTop: 12, color: '#837C96' }}>Protection on produces a generic, identity-free preview. This does not generate a realistic virtual try-on. Uploaded files are processed by this backend; all preview location metadata is removed.</Text>
    {!photos.length && <Text style={{ marginTop: 12 }}>No photos stored.</Text>}
    {photos.map(photo => <View key={photo.id} style={{ borderTopWidth: 1, borderColor: '#EEE9F6', marginTop: 14, paddingTop: 12 }}>
      <Text>{photo.category} · {new Date(photo.created_at).toLocaleString()}</Text>
      <Text style={{ marginTop: 6 }}>{photo.original_present ? 'Original retained' : 'Original deleted'} · {photo.preview_present ? 'Preview stored' : 'Preview unavailable'}</Text>
      {photo.expires_at && <Text>Original deletion due: {new Date(photo.expires_at).toLocaleString()}</Text>}
      {previews[photo.id] && <Image source={{ uri: previews[photo.id] }} style={{ height: 180, width: 180, marginTop: 10 }} resizeMode="contain" />}
      <View style={{ flexDirection: 'row' }}>
        {Platform.OS === 'web' && <Pressable accessibilityRole="button" disabled={busy} style={button} onPress={() => { void preview(photo); }}><Text style={label}>View private preview</Text></Pressable>}
        <Pressable accessibilityRole="button" disabled={busy} style={button} onPress={() => setRemove(photo)}><Text style={label}>Delete photo</Text></Pressable>
      </View>
    </View>)}
    <Pressable accessibilityRole="button" style={button} onPress={() => { void load(); }}><Text style={label}>Refresh photos</Text></Pressable>
    <Modal visible={!!remove} transparent onRequestClose={() => { if (!busy) setRemove(null); }}>
      <View style={{ flex: 1, backgroundColor: '#21123F80', justifyContent: 'center', padding: 30 }}><View style={{ backgroundColor: 'white', padding: 24, borderRadius: 20 }}>
        <Text>Delete this photo and its preview permanently?</Text>
        <Text accessibilityLiveRegion="polite">{message}</Text>
        <Pressable accessibilityRole="button" disabled={busy} style={button} onPress={() => { void deletePhoto(); }}><Text style={label}>{busy ? 'Deleting...' : 'Delete permanently'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} style={button} onPress={() => setRemove(null)}><Text>Cancel</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}
