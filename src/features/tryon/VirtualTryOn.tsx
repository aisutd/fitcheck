import { generateTryOn } from './client';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { chooseImage, Photo, validPhoto } from './photos';
const C = {
  ivory: '#F7F3EC', forest: '#283421', olive: '#586648', oliveHover: '#46533A',
  sage: '#969D7C', beige: '#EDE8DE', border: '#D8D3C5',
  muted: '#5E6455', paleSage: '#E0E3D5', white: '#FFFCF6', error: '#743F35',
};
const type = { editorial: Platform.OS === 'android' ? 'serif' : 'Georgia' };
const space = { small: 8, medium: 16, large: 24, section: 32 };
const radius = { pill: 999, card: 28 };

type Tab = 'Your Photo' | 'Garment';
function Button({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        s.button, secondary && s.secondaryButton,
        (pressed || hovered) && s.buttonHover, disabled && s.disabledButton,
      ]}
    >
      <Text style={[s.buttonText, disabled && s.disabledText]}>{title}</Text>
    </Pressable>
  );
}
function UploadTabs({ tab, onSelect }: { tab: Tab; onSelect: (v: Tab) => void }) {
  return <View style={s.tabs}>{(['Your Photo', 'Garment'] as Tab[]).map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => onSelect(item)} style={({ pressed }) => [s.tab, tab === item && s.selectedTab, pressed && s.pressedTab]}><Text style={[s.tabText, tab === item && s.selectedTabText]}>{item}</Text></Pressable>)}</View>;
}
function Placeholder({ garment }: { garment: boolean }) {
  return <View style={s.iconCircle} accessibilityElementsHidden>{garment ? <View style={s.shirt}><View style={[s.sleeve, { left: -14, transform: [{ rotate: '30deg' }] }]} /><View style={[s.sleeve, { right: -14, transform: [{ rotate: '-30deg' }] }]} /><View style={s.neck} /></View> : <View style={{ alignItems: 'center' }}><View style={s.head} /><View style={s.body} /><View style={{ flexDirection: 'row', gap: 6 }}><View style={s.leg} /><View style={s.leg} /></View></View>}</View>;
}
function PhotoUploadCard({ tab, photo, busy, height, onChoose, onRemove, onError }: { tab: Tab; photo: Photo | null; busy: boolean; height: number; onChoose: () => void; onRemove: () => void; onError: () => void }) {
  return <View style={[s.card, { minHeight: height }]}>{photo ? <><View style={s.preview}><Image source={{ uri: photo.uri }} resizeMode="contain" style={{ width: '100%', height: height - 104 }} onError={onError} accessibilityLabel={`Selected ${tab.toLowerCase()}`} /><View style={s.check}><Text style={{ color: C.forest, fontSize: 18 }} accessibilityLabel="Photo selected">✓</Text></View></View><View style={s.photoActions}><View style={{ flex: 1 }}><Button title="Replace Photo" secondary disabled={busy} onPress={onChoose} /></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${tab.toLowerCase()}`} disabled={busy} onPress={onRemove} style={s.remove}><Text style={s.smallLink}>Remove</Text></Pressable></View></> : <View style={s.empty}><Placeholder garment={tab === 'Garment'} /><Text style={s.cardTitle}>{tab === 'Your Photo' ? 'Upload a full-body photo' : 'Upload your garment'}</Text><Text style={s.instruction}>{tab === 'Your Photo' ? 'Stand naturally, fully clothed, with your whole body visible.' : 'Use a clear photo showing the entire clothing item.'}</Text><View style={{ width: 180, marginTop: 25 }}><Button title="Choose Photo" secondary disabled={busy} onPress={onChoose} /></View></View>}</View>;
}
function PhotoSourceSelector({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (camera: boolean) => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={s.modalRoot}><Pressable accessibilityRole="button" accessibilityLabel="Close photo menu" onPress={onClose} style={StyleSheet.absoluteFill} /><View style={s.menu} accessibilityViewIsModal><Text style={s.menuTitle}>Choose your photo</Text><Text style={s.menuSubtitle}>Find your favorite shot, or take a new one.</Text><Button title="Photo Library" secondary onPress={() => onSelect(false)} /><View style={{ height: 10 }} /><Button title="Take Photo" secondary onPress={() => onSelect(true)} /><Pressable onPress={onClose} accessibilityRole="button" style={s.cancel}><Text style={s.smallLink}>Cancel</Text></Pressable></View></View></Modal>;
}
function PhotoGuidance() { return <View style={s.guidance}><View style={s.tipRow}><View style={s.bulb}><View style={s.bulbBase} /></View><Text style={s.tipText}>Tip: Use bright, even lighting and avoid blurry or cropped images.</Text></View><View style={s.tipRow}><Text style={s.tipIcon}>◷</Text><Text style={s.tipText}>AI processing may take a little time.</Text></View></View>; }
export default function VirtualTryOn({ initialGarment, onClose }: { initialGarment?: Photo | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('Your Photo');
  const [userPhoto, setUserPhoto] = useState<Photo | null>(null);
  const [garmentPhoto, setGarmentPhoto] = useState<Photo | null>(initialGarment || null);
  const [sourceTab, setSourceTab] = useState<Tab | null>(null);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState('');
  const [dots, setDots] = useState(1);
  const [message, setMessage] = useState('');
  const mounted = useRef(true), busyRef = useRef(false), controller = useRef<AbortController | null>(null);
  const { height, width } = useWindowDimensions();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { if (!loading) return; const timer = setInterval(() => setDots(d => d % 3 + 1), 420); return () => clearInterval(timer); }, [loading]);
  const update = (target: Tab, value: Photo | null) => { (target === 'Your Photo' ? setUserPhoto : setGarmentPhoto)(value); setMessage(''); setGenerated(''); };
  async function select(camera: boolean) {
    if (!sourceTab || busyRef.current) return;
    const target = sourceTab; setSourceTab(null); busyRef.current = true; setPicking(true);
    try { const photo = await chooseImage(camera); if (mounted.current && photo) update(target, photo); }
    catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Could not open the photo picker. Please try again.'); }
    finally { busyRef.current = false; if (mounted.current) setPicking(false); }
  }
  async function generate() {
    if (busyRef.current || !validPhoto(userPhoto) || !validPhoto(garmentPhoto)) return;
    busyRef.current = true; setLoading(true); setMessage(''); setGenerated('');
    controller.current = new AbortController();
    try { const uri = await generateTryOn(userPhoto, garmentPhoto, controller.current.signal); if (mounted.current) setGenerated(uri); }
    catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Try-on failed.'); }
    finally { busyRef.current = false; if (mounted.current) setLoading(false); }
  }
  const photo = tab === 'Your Photo' ? userPhoto : garmentPhoto;
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.page}>
        <View pointerEvents="none" style={s.backdrop} />
        <View style={s.brandRow}>
          <Text style={s.brand}>fitcheck<Text style={s.brandDot}>.</Text></Text>
          <Text style={s.brandCaption}>YOUR STYLE STUDIO</Text>
        </View>
        <View style={s.content}>
          <Pressable accessibilityRole="button" onPress={onClose} style={s.back}>
            <Text style={s.smallLink}>← Back to FitCheck</Text>
          </Pressable>
          <View style={s.hero}>
            <Text style={s.eyebrow}>THE FITTING ROOM</Text>
            <Text accessibilityRole="header" style={[s.title, width < 480 && s.titleCompact]}>Virtual Try-On</Text>
            <Text style={s.subtitle}>See how your favorite pieces look on you.</Text>
          </View>
          <UploadTabs tab={tab} onSelect={setTab} />
          <PhotoUploadCard tab={tab} photo={photo} height={Math.max(330, Math.min(460, height * .43))}
            busy={loading || picking} onChoose={() => setSourceTab(tab)} onRemove={() => update(tab, null)}
            onError={() => { update(tab, null); controller.current?.abort(); setMessage('This image could not be displayed. Please choose another photo.'); }} />
          <PhotoGuidance />
          <Text style={s.modelNote}>This model needs a real full-body photo and a garment photo. Your configured avatar stays on your device; it is not a compatible input. Selected photos are sent to the configured try-on service when you generate.</Text>
          <Button title={loading ? `Generating${'.'.repeat(dots)}` : 'Generate Try-On →'}
            disabled={loading || picking || !validPhoto(userPhoto) || !validPhoto(garmentPhoto)} onPress={generate} />
          {generated ? (
            <View style={s.resultCard}>
              <Text style={s.eyebrow}>THE FITTING ROOM / RESULT</Text>
              <Text accessibilityRole="header" style={s.resultTitle}>Your Try-On</Text>
              <Image source={{ uri: generated }} style={[s.resultImage, { height: Math.min(500, Math.max(280, width - 100)) }]}
                resizeMode="contain" accessibilityLabel="Generated virtual try-on" />
            </View>
          ) : null}
          {!!message && <Text accessibilityLiveRegion="polite" style={s.message}>{message}</Text>}
          <Text style={s.footer}>Your style, seen in a new light.</Text>
        </View>
      </ScrollView>
      <PhotoSourceSelector visible={sourceTab !== null} onClose={() => setSourceTab(null)} onSelect={select} />
    </SafeAreaView>
  );
}

const outline = { borderWidth: 1.5, borderColor: C.olive };
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ivory },
  page: { paddingBottom: space.section, width: '100%', maxWidth: 960, alignSelf: 'center', overflow: 'hidden' },
  backdrop: { position: 'absolute', top: 60, right: -150, width: 410, height: 270, backgroundColor: C.paleSage, opacity: 0.45, borderRadius: 180, transform: [{ rotate: '-24deg' }] },
  brandRow: { paddingHorizontal: space.large, paddingVertical: space.medium, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.small, borderBottomWidth: 1, borderBottomColor: C.border },
  brand: { fontSize: 35, letterSpacing: -1.8, color: C.forest, fontFamily: type.editorial },
  brandDot: { color: C.sage },
  brandCaption: { fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: '600' },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', paddingHorizontal: space.large },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: space.small },
  hero: { alignItems: 'center', paddingTop: space.large, paddingBottom: space.section },
  eyebrow: { color: C.olive, fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 10 },
  title: { color: C.forest, fontSize: 62, letterSpacing: -2.5, fontFamily: type.editorial, textAlign: 'center' },
  titleCompact: { fontSize: 44, letterSpacing: -1.5 },
  subtitle: { marginTop: 10, fontSize: 15, color: C.muted, lineHeight: 23, textAlign: 'center' },
  tabs: { flexDirection: 'row', padding: 4, backgroundColor: C.beige, borderWidth: 1, borderColor: C.border, borderRadius: radius.pill, marginBottom: space.medium },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, paddingHorizontal: space.small, paddingVertical: 8 },
  selectedTab: { backgroundColor: C.olive },
  pressedTab: { opacity: 0.78 },
  tabText: { color: C.forest, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  selectedTabText: { color: C.white },
  card: { backgroundColor: C.beige, borderWidth: 1, borderColor: C.border, borderRadius: radius.card, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.large },
  iconCircle: { height: 96, width: 96, borderRadius: 48, backgroundColor: C.paleSage, alignItems: 'center', justifyContent: 'center', marginBottom: space.large },
  head: { ...outline, width: 16, height: 16, borderRadius: 8, marginBottom: 5 },
  body: { ...outline, height: 26, width: 26, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: 0 },
  leg: { ...outline, height: 21, width: 8, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  shirt: { ...outline, width: 32, height: 39, borderRadius: 3 },
  sleeve: { ...outline, position: 'absolute', top: -1, height: 18, width: 16, backgroundColor: C.paleSage },
  neck: { ...outline, position: 'absolute', top: -3, left: 7, width: 15, height: 9, backgroundColor: C.paleSage, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopWidth: 0 },
  cardTitle: { fontSize: 27, color: C.forest, textAlign: 'center', fontFamily: type.editorial },
  instruction: { fontSize: 13, lineHeight: 21, color: C.muted, textAlign: 'center', maxWidth: 320, marginTop: 10 },
  preview: { padding: space.medium },
  check: { position: 'absolute', top: space.medium, right: space.medium, backgroundColor: C.paleSage, borderRadius: radius.pill, borderColor: C.sage, borderWidth: 1, height: 32, width: 32, alignItems: 'center', justifyContent: 'center' },
  photoActions: { flexDirection: 'row', gap: 12, paddingHorizontal: space.medium, paddingBottom: space.medium, alignItems: 'center' },
  remove: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
  smallLink: { color: C.forest, fontSize: 13, fontWeight: '600' },
  guidance: { gap: 12, paddingTop: space.large, paddingBottom: space.medium },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulb: { width: 12, height: 14, borderWidth: 1, borderColor: C.olive, borderRadius: 8, marginHorizontal: 4, marginTop: 2 },
  bulbBase: { width: 6, height: 4, borderBottomWidth: 1, borderColor: C.olive, position: 'absolute', bottom: -4, left: 2 },
  tipIcon: { fontSize: 18, color: C.olive, width: 20, textAlign: 'center' },
  tipText: { flex: 1, color: C.muted, fontSize: 13, lineHeight: 20 },
  modelNote: { color: C.muted, fontSize: 12, lineHeight: 19, padding: space.medium, marginBottom: space.medium, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  button: { minHeight: 54, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: C.olive },
  secondaryButton: { minHeight: 46 },
  buttonHover: { backgroundColor: C.oliveHover },
  disabledButton: { backgroundColor: C.paleSage },
  buttonText: { fontSize: 14, fontWeight: '700', color: C.white, textAlign: 'center' },
  disabledText: { color: C.muted },
  message: { color: C.error, textAlign: 'center', marginTop: space.medium, fontSize: 13, lineHeight: 21 },
  resultCard: { marginTop: space.large, padding: space.large, backgroundColor: C.beige, borderWidth: 1, borderColor: C.border, borderRadius: radius.card },
  resultTitle: { fontSize: 30, color: C.forest, fontFamily: type.editorial, marginBottom: space.medium },
  resultImage: { width: '100%', backgroundColor: C.ivory, borderRadius: 16 },
  footer: { color: C.muted, fontSize: 13, fontFamily: type.editorial, fontStyle: 'italic', textAlign: 'center', marginTop: space.large },
  modalRoot: { flex: 1, backgroundColor: 'rgba(40,52,33,.32)', justifyContent: 'center', alignItems: 'center', padding: space.large },
  menu: { backgroundColor: C.ivory, padding: space.large, width: '100%', maxWidth: 380, borderRadius: radius.card, borderWidth: 1, borderColor: C.border },
  menuTitle: { color: C.forest, fontSize: 29, fontFamily: type.editorial },
  menuSubtitle: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: space.large },
  cancel: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: space.small },
});
