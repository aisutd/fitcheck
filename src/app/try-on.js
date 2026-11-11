import { resolveImageUri } from '../features/collections/photoSource';
import { router, useLocalSearchParams } from 'expo-router';
import { useFitCheck } from '../../App';
import VirtualTryOn from '../features/tryon/VirtualTryOn';
import { Image, Text, Pressable, View } from 'react-native';
import { useState } from 'react';
import FeaturePage, { ui } from '../components/FeaturePage';
export default function TryOnRoute() {
 const { items = '' } = useLocalSearchParams();
 const { wardrobeState } = useFitCheck();
 const selected = wardrobeState.personalItems.filter((item) => String(items).split(',').includes(item.id) && item.photoUri);
 const [garment, setGarment] = useState(null);
 const [ready, setReady] = useState(selected.length === 0);
 if (!ready) return <FeaturePage title="Choose a piece."><Text style={ui.body}>Choose a garment from this outfit, or upload another photo.</Text>{selected.map((item) => <Pressable key={item.id} style={ui.card} onPress={() => Image.getSize(resolveImageUri(item.photoUri), (width, height) => { setGarment({ uri: resolveImageUri(item.photoUri), width, height, type: 'image', mimeType: 'image/jpeg', fileName: 'garment.jpg' }); setReady(true); }, () => setReady(true))}><Image source={{ uri: resolveImageUri(item.photoUri) }} style={{ height: 150, width: '100%' }} resizeMode="contain" /><Text style={ui.link}>{item.name}</Text></Pressable>)}<Pressable style={ui.button} onPress={() => setReady(true)}><Text style={ui.link}>Upload another garment</Text></Pressable></FeaturePage>;
 return <View style={{ flex: 1 }}><VirtualTryOn initialGarment={garment} onClose={() => router.canGoBack() ? router.back() : router.replace('/')} /></View>;
}
