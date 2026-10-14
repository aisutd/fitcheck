import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PhotoRetentionSettings, PrivacyExtras } from './PrivacyExtras';
import { countMockRecords, emptyMockData, initialMockData } from './privacyData';

const C = { purple: '#9765E0', lavender: '#CE95FB', teal: '#00C2BA', indigo: '#534FA5', deep: '#36009C', background: '#F7F5FC', text: '#29233F', muted: '#837C96' };
const choices = [
  { label: 'Public', description: 'Anyone can view your shared closet.', icon: 'globe-outline' },
  { label: 'Friends Only', description: 'Only friends can view your shared closet.', icon: 'people-outline' },
  { label: 'Private', description: 'Only you can view your closet.', icon: 'lock-closed-outline' },
] as const;
type Privacy = typeof choices[number]['label'];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Icon({ name, color = C.purple, size = 22 }: { name: IconName; color?: string; size?: number }) {
  return <Ionicons name={name} color={color} size={size} />;
}

function Toggle({ enabled, onChange, label = 'Automatically delete photos' }: { enabled: boolean; onChange: () => void; label?: string }) {
  const progress = useRef(new Animated.Value(enabled ? 1 : 0)).current;
  useEffect(() => { Animated.timing(progress, { toValue: enabled ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [enabled, progress]);
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: enabled }} onPress={onChange} hitSlop={12}>
    <Animated.View style={[s.toggle, { backgroundColor: progress.interpolate({ inputRange: [0, 1], outputRange: ['#DCD7E9', C.teal] }) }]}>
      <Animated.View style={[s.knob, { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) }] }]} />
    </Animated.View>
  </Pressable>;
}

export function PrivacyDataScreen({ onBack, privacyPolicyUrl }: { onBack?: () => void; privacyPolicyUrl?: string }) {
  const [privacy, setPrivacy] = useState<Privacy>('Private');
  const [privateMirror, setPrivateMirror] = useState(true);
  const [dropdown, setDropdown] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [data, setData] = useState(initialMockData);
  const storedCount = countMockRecords(data);
  const menuProgress = useRef(new Animated.Value(0)).current;
  const [menuMounted, setMenuMounted] = useState(false);
  useEffect(() => {
    if (dropdown) setMenuMounted(true);
    const animation = Animated.timing(menuProgress, { toValue: dropdown ? 1 : 0, duration: 180, useNativeDriver: false });
    animation.start(({ finished }) => { if (finished && !dropdown) setMenuMounted(false); });
    return () => animation.stop();
  }, [dropdown, menuProgress]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 5500); return () => clearTimeout(timer); }, [notice]);
  const selected = choices.find(option => option.label === privacy)!;
  return <SafeAreaView style={s.safe}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.topbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => onBack ? onBack() : setNotice('You’re already on the first screen.')} style={({ pressed }) => [s.back, pressed && s.pressed]}><Icon name="arrow-back" color={C.deep} /></Pressable>
        <View style={s.brand}><View style={s.brandDot} /><Text style={s.brandText}>FITCHECK</Text></View>
        <View style={s.secureBadge}><Icon name="shield-checkmark" color={C.teal} size={15} /><Text style={s.secureText}>SECURE</Text></View>
      </View>

      <View style={s.heading}><Text style={s.eyebrow}>YOUR SPACE. YOUR RULES.</Text><Text style={s.title}>Privacy & Data<Text style={{ color: C.purple }}>.</Text></Text><Text style={s.subtitle}>Take control of your privacy and personal information.</Text></View>

      <LinearGradient colors={['#534FA5', '#36009C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.orbitOne} /><View style={s.orbitTwo} />
        <View style={s.heroIcon}><Icon name="shield-checkmark-outline" color="#E9D5FF" size={30} /></View>
        <View style={{ flex: 1 }}><Text style={s.heroTitle}>A little more peace of mind.</Text><Text style={s.heroText}>Your privacy is always in your hands.</Text><View style={s.heroTag}><View style={s.tealDot} /><Text style={s.heroTagText}>You’re in control</Text></View></View>
      </LinearGradient>

      <View style={s.sectionLine}><Text style={s.sectionTitle}>PRIVACY PREFERENCES</Text><Icon name="options-outline" color={C.muted} size={17} /></View>
      <View style={s.card}>
        <View style={s.cardHeader}><View style={s.iconBox}><Icon name="people-outline" /></View><View style={s.cardHeading}><Text style={s.cardTitle}>Closet Visibility</Text><Text style={s.description}>Your closet starts private. Choose who can see it.</Text></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Closet visibility: ${privacy}`} accessibilityState={{ expanded: dropdown }} onPress={() => setDropdown(!dropdown)} style={({ pressed }) => [s.selector, dropdown && { borderColor: C.purple }, pressed && s.pressed]}>
          <View style={s.row}><Icon name={selected.icon} color={C.indigo} size={19} /><Text style={s.selectionText}>{privacy}</Text></View><Icon name={dropdown ? 'chevron-up' : 'chevron-down'} color={C.indigo} size={19} />
        </Pressable>
        {menuMounted && <Animated.View style={{ overflow: 'hidden', maxHeight: menuProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 240] }), opacity: menuProgress }}>
          <View style={s.menu}>{choices.map(option => <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: option.label === privacy }} onPress={() => { setPrivacy(option.label); setDropdown(false); }} style={({ pressed }) => [s.option, option.label === privacy && s.selectedOption, pressed && s.pressed]}>
            <Icon name={option.icon} color={option.label === privacy ? C.purple : C.muted} size={20} /><View style={{ flex: 1 }}><Text style={s.optionTitle}>{option.label}</Text><Text style={s.optionDescription}>{option.description}</Text></View>{option.label === privacy && <Icon name="checkmark-circle" color={C.purple} size={21} />}
          </Pressable>)}</View>
        </Animated.View>}
        <View style={s.hint}><Icon name="information-circle-outline" size={15} color={C.muted} /><Text style={s.hintText}>{selected.description}</Text></View>
      </View>

      <PhotoRetentionSettings />

      <View style={[s.card, s.mirrorCard]}>
        <View style={s.cardHeader}>
          <View style={[s.iconBox, { backgroundColor: '#E9F8F6' }]}><Icon name="scan-outline" color={C.teal} /></View>
          <View style={s.cardHeading}><View style={s.mirrorTitleRow}><Text style={s.cardTitle}>Private Mirror</Text><Text style={s.previewBadge}>PREVIEW</Text></View><Text style={s.description}>See the outfit on your shape. Keep your identity on your phone.</Text></View>
        </View>
        <View style={s.toggleRow}>
          <View style={s.row}><View style={[s.statusDot, { backgroundColor: privateMirror ? C.teal : '#ADA5BD' }]} /><Text style={[s.statusText, privateMirror && { color: '#008A84' }]}>{privateMirror ? 'Private Mirror selected' : 'Photo try-on selected'}</Text></View>
          <Toggle enabled={privateMirror} onChange={() => setPrivateMirror(value => !value)} label="Private Mirror preview" />
        </View>
        <View style={s.mirrorMode}>
          <Icon name={privateMirror ? 'person-outline' : 'camera-outline'} color={privateMirror ? C.teal : C.purple} size={24} />
          <View style={{ flex: 1 }}><Text style={s.optionTitle}>{privateMirror ? 'Faceless avatar' : 'Photo-based try-on'}</Text><Text style={s.optionDescription}>{privateMirror ? 'Designed to keep your original photo on-device.' : 'Designed for a more realistic preview using your photo.'}</Text></View>
        </View>
        <View style={s.hint}><Icon name="information-circle-outline" size={15} color={C.muted} /><Text style={s.hintText}>Demo preference only. Avatar generation and on-device photo processing are not implemented.</Text></View>
      </View>

      <PrivacyExtras data={data} setData={setData} notify={setNotice} Toggle={Toggle} />
      <View style={[s.sectionLine, { marginTop: 30 }]}><Text style={s.sectionTitle}>YOUR DATA</Text><Text style={s.localLabel}>ON THIS DEVICE · DEMO</Text></View>
      <View style={s.dataCard}><View style={s.dataHeading}><View style={s.iconBox}><Icon name="server-outline" color={C.indigo} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>A fresh start</Text><Text style={s.description}>{storedCount ? `${storedCount} mock records in this session` : 'No mock data stored'}</Text></View><Icon name={storedCount ? 'cloud-outline' : 'checkmark-circle-outline'} color={storedCount ? C.lavender : C.teal} size={25} /></View>
        <Text style={s.dataDescription}>Clear your stored information whenever you’re ready. The choice is yours.</Text>
        <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={({ pressed }) => [s.deleteButton, pressed && s.pressed]}><Icon name="trash-outline" color={C.deep} size={19} /><Text style={s.deleteText}>Delete All My Data</Text><Icon name="arrow-forward" color={C.deep} size={18} /></Pressable>
        <Text style={s.demoNote}>Demo only — no server data is accessed or deleted.</Text>
      </View>
      <View style={s.footer}><Icon name="lock-closed-outline" color={C.muted} size={13} /><Text style={s.footerText}>Your privacy isn’t a feature. It’s a promise.</Text></View>
      <Pressable accessibilityRole="link" accessibilityLabel="Read Fitcheck Privacy Policy" onPress={() => {
        if (privacyPolicyUrl) {
          Linking.openURL(privacyPolicyUrl).catch(() => setNotice('Unable to open the Privacy Policy. Please try again.'));
        } else {
          setPolicyVisible(true);
        }
      }} style={({ pressed }) => [s.policyLink, pressed && s.pressed]}>
        <Text style={s.policyLinkText}>Privacy Policy</Text>
      </Pressable>
    </ScrollView>
    {notice && <Pressable accessibilityRole="button" accessibilityLabel={`${notice} Dismiss message`} accessibilityLiveRegion="polite" onPress={() => setNotice(null)} style={s.toast}><Icon name="checkmark-circle" color={C.teal} /><Text style={s.toastText}>{notice}</Text><Icon name="close" size={17} color={C.muted} /></Pressable>}
    <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
      <View style={s.modalOverlay}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Dismiss confirmation" accessibilityRole="button" onPress={() => setConfirm(false)} /><View style={s.modalCard} accessibilityViewIsModal>
        <View style={s.modalIcon}><Icon name="trash-outline" color={C.deep} size={30} /></View><Text style={s.modalTitle}>Delete All Data?</Text><Text style={s.modalDescription}>This action will permanently delete your stored information and cannot be undone.</Text><Text style={s.modalDemo}>This preview clears mock files in this session only.</Text>
        <Pressable accessibilityRole="button" style={({ pressed }) => [s.confirmButton, pressed && s.pressed]} onPress={() => { setData(emptyMockData); setConfirm(false); setNotice('Your data has been deleted successfully.'); }}><Text style={s.confirmText}>Delete Data</Text></Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [s.cancelButton, pressed && s.pressed]} onPress={() => setConfirm(false)}><Text style={s.cancelText}>Cancel</Text></Pressable>
      </View></View>
    </Modal>
    <Modal visible={policyVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPolicyVisible(false)}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.topbar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to Privacy and Data" onPress={() => setPolicyVisible(false)} style={({ pressed }) => [s.back, pressed && s.pressed]}><Icon name="arrow-back" color={C.deep} /></Pressable>
            <View style={s.brand}><View style={s.brandDot} /><Text style={s.brandText}>FITCHECK</Text></View>
            <View style={{ width: 42 }} />
          </View>
          <View style={s.heading}>
            <Text style={s.eyebrow}>PRIVACY & TRANSPARENCY</Text>
            <Text accessibilityRole="header" style={s.title}>Privacy Policy<Text style={{ color: C.purple }}>.</Text></Text>
            <Text style={s.subtitle}>How information is handled in this preview.</Text>
          </View>
          <View style={s.card}>
            <Text style={s.eyebrow}>MOCKUP PREVIEW</Text>
            <Text style={s.description}>This page describes the demo screen only. Fitcheck’s official Privacy Policy has not been supplied.</Text>
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.cardTitle}>Demo information</Text>
            <Text style={s.description}>The settings screen uses sample file names and temporary React state. No account, photo upload, authentication system, or database is connected.</Text>
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.cardTitle}>Privacy preferences</Text>
            <Text style={s.description}>Closet visibility, photo retention, AI training consent, photo protection, and shopping permissions change local demo preferences. They do not enforce real processing rules or affect an actual Fitcheck account. These settings reset when the app reloads.</Text>
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.cardTitle}>Private Mirror preview</Text>
            <Text style={s.description}>Private Mirror lets you preview a preference for faceless-avatar try-ons instead of photo-based try-ons. This mockup does not create avatars, process photos, or implement an on-device AI pipeline.</Text>
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.cardTitle}>Deleting demo data</Text>
            <Text style={s.description}>You can edit or forget saved demo preferences, delete records by category, or clear all mock information. Closet deletion also removes saved outfits. None of these actions delete information from a server or remove files from your device.</Text>
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.cardTitle}>Exporting your closet</Text>
            <Text style={s.description}>Download My Closet creates a JSON file containing the current sample clothing details and saved outfits. It does not include body photos, chat history, preferences, or real uploaded images.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><PrivacyDataScreen /></SafeAreaProvider>; }

const s = StyleSheet.create({
  mirrorCard: { borderColor: '#CBEAE6' },
  mirrorTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  previewBadge: { color: C.indigo, backgroundColor: '#F1EAFB', fontSize: 8, fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 5 },
  mirrorMode: { marginTop: 16, backgroundColor: '#F7F5FC', borderRadius: 13, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  policyLink: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  policyLinkText: { color: C.indigo, fontSize: 10, textDecorationLine: 'underline' },
  safe: { flex: 1, backgroundColor: C.background }, content: { padding: 24, paddingTop: 12, paddingBottom: 30, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE7F5' }, brand: { flexDirection: 'row', gap: 7, alignItems: 'center' }, brandDot: { width: 10, height: 10, borderRadius: 3, backgroundColor: C.purple, transform: [{ rotate: '45deg' }] }, brandText: { color: C.deep, fontSize: 13, fontWeight: '800', letterSpacing: 3 }, secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 }, secureText: { color: '#008A84', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  heading: { marginTop: 30, marginBottom: 25 }, eyebrow: { color: C.purple, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }, title: { color: C.deep, fontSize: 34, fontWeight: '800', letterSpacing: -1.3 }, subtitle: { color: C.muted, fontSize: 14, lineHeight: 22, marginTop: 10, maxWidth: 310 },
  hero: { borderRadius: 23, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 15, overflow: 'hidden' }, heroIcon: { width: 56, height: 64, backgroundColor: '#FFFFFF15', borderRadius: 18, borderWidth: 1, borderColor: '#FFFFFF25', justifyContent: 'center', alignItems: 'center' }, heroTitle: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontWeight: '700' }, heroText: { color: '#DDD1F3', fontSize: 12, lineHeight: 18, marginTop: 5 }, heroTag: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 12 }, tealDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.teal }, heroTagText: { color: '#D7F9F5', fontSize: 10, fontWeight: '600' }, orbitOne: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: '#FFFFFF13', right: -65, top: -60 }, orbitTwo: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: '#FFFFFF13', right: -35, top: -30 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14, gap: 8 }, sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.6 }, card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#EEE9F6', shadowColor: C.indigo, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2 }, cardHeader: { flexDirection: 'row', gap: 13, alignItems: 'flex-start' }, iconBox: { width: 42, height: 42, backgroundColor: '#F1EAFB', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardHeading: { flex: 1 }, cardTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 1 }, description: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 5 }, selector: { marginTop: 20, borderWidth: 1, borderColor: '#E5DCF3', borderRadius: 13, padding: 14, backgroundColor: '#FAF8FE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, row: { flexDirection: 'row', gap: 10, alignItems: 'center' }, selectionText: { color: C.indigo, fontSize: 14, fontWeight: '600' }, hint: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 13 }, hintText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 16 }, menu: { marginTop: 8, gap: 4 }, option: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: 12 }, selectedOption: { backgroundColor: '#F3ECFC' }, optionTitle: { fontSize: 13, fontWeight: '600', color: C.text }, optionDescription: { fontSize: 10, color: C.muted, marginTop: 3 }, toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { color: C.muted, fontSize: 12, fontWeight: '500' }, toggle: { width: 52, height: 30, borderRadius: 20, padding: 4 }, knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 }, divider: { height: 1, backgroundColor: '#F1EDF7', marginTop: 17 }, localLabel: { fontSize: 8, letterSpacing: 0.5, color: C.muted }, dataCard: { borderRadius: 22, padding: 20, backgroundColor: '#F0EAF9', borderWidth: 1, borderColor: '#E4D9F4' }, dataHeading: { flexDirection: 'row', gap: 12, alignItems: 'center' }, dataDescription: { color: '#80748F', fontSize: 12, lineHeight: 20, marginTop: 16, marginBottom: 18 }, deleteButton: { borderWidth: 1, borderColor: '#36009C50', borderRadius: 13, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFFFF65' }, deleteText: { flex: 1, fontSize: 13, fontWeight: '700', color: C.deep }, demoNote: { fontSize: 9, textAlign: 'center', color: C.muted, lineHeight: 15, marginTop: 12 }, footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 25 }, footerText: { color: C.muted, fontSize: 10 }, pressed: { opacity: 0.65 },
  toast: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, left: 20, right: 20, maxWidth: 520, alignSelf: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 17, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: C.deep, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 8, borderWidth: 1, borderColor: '#DAF2EC' }, toastText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 20 }, modalOverlay: { flex: 1, backgroundColor: '#21123F80', justifyContent: 'center', alignItems: 'center', padding: 28 }, modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 26, alignItems: 'center' }, modalIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#F1EAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, modalTitle: { color: C.deep, fontSize: 24, fontWeight: '700' }, modalDescription: { textAlign: 'center', color: C.muted, fontSize: 14, lineHeight: 23, marginTop: 13 }, modalDemo: { fontSize: 11, color: C.indigo, textAlign: 'center', lineHeight: 18, marginTop: 13, marginBottom: 23 }, confirmButton: { backgroundColor: C.purple, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' }, confirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, cancelButton: { padding: 16, width: '100%', alignItems: 'center', marginTop: 6 }, cancelText: { color: C.indigo, fontSize: 14, fontWeight: '600' },
});
