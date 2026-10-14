import React, { useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportCloset } from './exportCloset';
import { MockData } from './privacyData';

type ToggleComponent = React.ComponentType<{ enabled: boolean; onChange: () => void; label?: string }>;
type Props = { data: MockData; setData: React.Dispatch<React.SetStateAction<MockData>>; notify: (message: string) => void; Toggle: ToggleComponent };
const colors = { purple: '#9765E0', lavender: '#CE95FB', teal: '#00C2BA', indigo: '#534FA5', deep: '#36009C', text: '#29233F', muted: '#837C96' };
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const retentionOptions = ['After processing', 'After 24 hours', 'Keep until I delete'] as const;
type Retention = typeof retentionOptions[number];
const deletable = [
  { key: 'bodyPhotos', name: 'Body photos' },
  { key: 'tryOns', name: 'Generated try-ons' },
  { key: 'closet', name: 'Closet items' },
  { key: 'chats', name: 'Chat history' },
] as const;
type DeleteKey = typeof deletable[number]['key'];

function Card({ title, description, icon, children }: { title: string; description: string; icon: IconName; children: React.ReactNode }) {
  return <View style={s.card}><View style={s.header}><View style={s.iconBox}><Ionicons name={icon} color={colors.purple} size={22} /></View><View style={{ flex: 1 }}><Text style={s.title}>{title}</Text><Text style={s.description}>{description}</Text></View></View>{children}</View>;
}
function ToggleRow({ title, description, enabled, onChange, Toggle }: { title: string; description: string; enabled: boolean; onChange: () => void; Toggle: ToggleComponent }) {
  return <View style={s.settingRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.description}>{description}</Text></View><Toggle label={title} enabled={enabled} onChange={onChange} /></View>;
}

export function PhotoRetentionSettings() {
  const [retention, setRetention] = useState<Retention>('After processing');
  const [open, setOpen] = useState(false);
  return <Card title="Try-On Photo Retention" description="Choose when your original try-on photos should be removed." icon="timer-outline">
    <Pressable accessibilityRole="button" accessibilityLabel={`Try-on photo retention: ${retention}`} accessibilityState={{ expanded: open }} style={s.selector} onPress={() => setOpen(value => !value)}><Text style={s.selectorText}>{retention}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.indigo} /></Pressable>
    {open && <Animated.View style={s.options}>{retentionOptions.map(option => <Pressable accessibilityRole="button" accessibilityState={{ selected: retention === option }} key={option} style={[s.option, retention === option && { backgroundColor: '#F1EAFB' }]} onPress={() => { setRetention(option); setOpen(false); }}><Text style={s.rowTitle}>{option}</Text>{retention === option && <Ionicons name="checkmark-circle" color={colors.purple} size={20} />}</Pressable>)}</Animated.View>}
    <Text style={s.note}>Preview preference only. No photos are processed or automatically deleted in this demo.</Text>
  </Card>;
}

export function PrivacyExtras({ data, setData, notify, Toggle }: Props) {
  const [training, setTraining] = useState(false);
  const [blurFace, setBlurFace] = useState(true);
  const [blurBackground, setBlurBackground] = useState(true);
  const [stripLocation, setStripLocation] = useState(true);
  const [personalize, setPersonalize] = useState(true);
  const [retailerSharing, setRetailerSharing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.memory);
  const [error, setError] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<DeleteKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const deleteName = deletable.find(item => item.key === deleteKey)?.name;
  const saveMemory = () => {
    if (draft.budget.trim() && (!/^\d+(\.\d{1,2})?$/.test(draft.budget.trim()) || Number(draft.budget) <= 0)) {
      setError('Enter a budget greater than zero, or leave it empty.'); return;
    }
    setData(previous => ({ ...previous, memory: { style: draft.style.trim(), size: draft.size.trim(), budget: draft.budget.trim() } }));
    setEditing(false); setError(null); notify('Your saved preferences have been updated.');
  };
  const download = async () => {
    setExporting(true);
    try {
      await exportCloset(JSON.stringify({ app: 'Fitcheck', demo: true, exportedAt: new Date().toISOString(), closet: data.closet, savedOutfits: data.outfits, note: 'Sample item metadata only. This mockup contains no uploaded photo files.' }, null, 2));
      notify(Platform.OS === 'web' ? 'Your mock closet download has started.' : 'Mock closet export opened in your device’s share sheet.');
    } catch { notify('Could not export your closet. Please try again on a device with file sharing.'); }
    finally { setExporting(false); }
  };
  return <>
    <Text style={s.section}>AI & PHOTO PERMISSIONS</Text>
    <Card title="AI Training Consent" description="Choose whether photos and chats may be used to improve AI models." icon="sparkles-outline">
      <ToggleRow title="Allow AI training" description={training ? 'Consent selected for this preview.' : 'Not allowed by default.'} enabled={training} onChange={() => setTraining(value => !value)} Toggle={Toggle} />
      <Text style={s.note}>Demo consent only. No photos or conversations are sent to an AI provider.</Text>
    </Card>
    <Card title="Photo Protection" description="Preview safeguards to apply before a photo leaves your device." icon="eye-off-outline">
      <ToggleRow title="Blur faces" description="Conceal faces in clothing photos." enabled={blurFace} onChange={() => setBlurFace(value => !value)} Toggle={Toggle} />
      <ToggleRow title="Hide the background" description="Keep your room and surroundings out of view." enabled={blurBackground} onChange={() => setBlurBackground(value => !value)} Toggle={Toggle} />
      <ToggleRow title="Remove location metadata" description="Strip embedded GPS information." enabled={stripLocation} onChange={() => setStripLocation(value => !value)} Toggle={Toggle} />
      <Text style={s.note}>Preview switches only. Image editing and metadata removal are not implemented.</Text>
    </Card>
    <Text style={s.section}>SHOPPING & PERSONALIZATION</Text>
    <Card title="Shopping Privacy" description="Keep helpful recommendations on your terms." icon="bag-handle-outline">
      <ToggleRow title="Personalized suggestions" description="Use your saved style and budget to tailor recommendations." enabled={personalize} onChange={() => setPersonalize(value => !value)} Toggle={Toggle} />
      <ToggleRow title="Share preferences with retailers" description="Separate permission to share style and budget with shopping partners." enabled={retailerSharing} onChange={() => setRetailerSharing(value => !value)} Toggle={Toggle} />
      <Text style={s.note}>Demo permissions only. No retailer or recommendation service is connected.</Text>
    </Card>
    <Card title="What Fitcheck Remembers" description="Review, edit, or forget your saved preferences." icon="bulb-outline">
      <View style={s.memoryList}>{[['Style', data.memory.style || 'Not saved'], ['Size', data.memory.size || 'Not saved'], ['Budget per item', data.memory.budget ? `$${data.memory.budget}` : 'Not saved']].map(([label, value]) => <View key={label} style={s.memoryRow}><Text style={s.description}>{label}</Text><Text style={s.memoryValue}>{value}</Text></View>)}</View>
      <Pressable accessibilityRole="button" style={({ pressed }) => [s.button, pressed && s.pressed]} onPress={() => { setDraft({ ...data.memory }); setError(null); setEditing(true); }}><Ionicons name="create-outline" size={18} color={colors.deep} /><Text style={s.buttonText}>Edit preferences</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={!Object.values(data.memory).some(Boolean)} style={({ pressed }) => [s.textButton, (pressed || !Object.values(data.memory).some(Boolean)) && s.pressed]} onPress={() => { setData(previous => ({ ...previous, memory: { style: '', size: '', budget: '' } })); notify('Your demo preferences have been forgotten.'); }}><Text style={s.textButtonText}>Forget all preferences</Text></Pressable>
    </Card>
    <Text style={s.section}>MANAGE YOUR DATA</Text>
    <Card title="Delete by Category" description="Clear just the demo information you choose." icon="trash-outline">
      {deletable.map(item => <View key={item.key} style={s.settingRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{item.name}</Text><Text style={s.description}>{data[item.key].length} mock {data[item.key].length === 1 ? 'record' : 'records'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name.toLowerCase()}`} disabled={!data[item.key].length} onPress={() => setDeleteKey(item.key)} style={({ pressed }) => [s.smallButton, (pressed || !data[item.key].length) && s.pressed]}><Text style={s.textButtonText}>{data[item.key].length ? 'Delete' : 'Cleared'}</Text></Pressable></View>)}
    </Card>
    <Card title="Download My Closet" description="Take your closet items and saved outfits with you." icon="download-outline">
      <Pressable accessibilityRole="button" disabled={exporting} style={({ pressed }) => [s.button, (pressed || exporting) && s.pressed]} onPress={download}><Ionicons name="download-outline" color={colors.deep} size={18} /><Text style={s.buttonText}>{exporting ? 'Preparing export…' : 'Export mock closet · JSON'}</Text></Pressable>
      <Text style={s.note}>Includes current sample item details and saved outfits. This demo has no photo files to export.</Text>
    </Card>
    <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
      <View style={s.overlay}><Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Cancel editing" onPress={() => setEditing(false)} /><ScrollView style={s.dialogScroll} contentContainerStyle={s.dialog} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={s.dialogTitle}>Your preferences</Text><Text style={s.description}>Edit what Fitcheck remembers. Leave a field empty to forget it.</Text>
        {(['style', 'size', 'budget'] as const).map(field => <View key={field} style={{ marginTop: 16 }}><Text style={s.rowTitle}>{field === 'style' ? 'Your style' : field === 'size' ? 'Clothing size' : 'Budget per item (USD)'}</Text><TextInput accessibilityLabel={field === 'budget' ? 'Budget per item in US dollars' : `Saved ${field}`} value={draft[field]} onChangeText={value => setDraft(previous => ({ ...previous, [field]: value }))} style={s.input} keyboardType={field === 'budget' ? 'decimal-pad' : 'default'} maxLength={field === 'style' ? 120 : 20} placeholder="Not saved" placeholderTextColor={colors.muted} /></View>)}
        {error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
        <Pressable accessibilityRole="button" style={[s.button, s.primaryButton]} onPress={saveMemory}><Text style={s.primaryText}>Save preferences</Text></Pressable><Pressable accessibilityRole="button" style={s.textButton} onPress={() => setEditing(false)}><Text style={s.textButtonText}>Cancel</Text></Pressable>
      </ScrollView></View>
    </Modal>
    <Modal visible={deleteKey !== null} transparent animationType="fade" onRequestClose={() => setDeleteKey(null)}>
      <View style={s.overlay}><Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Cancel deletion" onPress={() => setDeleteKey(null)} /><View style={s.dialog} accessibilityViewIsModal><Text style={s.dialogTitle}>Delete {deleteName?.toLowerCase()}?</Text><Text style={s.description}>This removes only this category’s mock records in the current session.{deleteKey === 'closet' ? ' Saved outfits referencing these items will also be cleared.' : ''} No real data is deleted.</Text>
        <Pressable accessibilityRole="button" style={[s.button, s.primaryButton]} onPress={() => {
          if (!deleteKey) return;
          const key = deleteKey;
          setData(previous => ({ ...previous, [key]: [], ...(key === 'closet' ? { outfits: [] } : {}) }));
          setDeleteKey(null); notify(`${deleteName} cleared from this demo.`);
        }}><Text style={s.primaryText}>Delete {deleteName?.toLowerCase()}</Text></Pressable><Pressable accessibilityRole="button" style={s.textButton} onPress={() => setDeleteKey(null)}><Text style={s.textButtonText}>Cancel</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}

const s = StyleSheet.create({
  section: { marginTop: 18, marginBottom: 14, color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#EEE9F6', shadowColor: colors.indigo, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2 },
  header: { flexDirection: 'row', gap: 13, alignItems: 'flex-start' }, iconBox: { width: 42, height: 42, backgroundColor: '#F1EAFB', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 16, fontWeight: '700' }, description: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 }, rowTitle: { color: colors.text, fontSize: 13, fontWeight: '600' }, settingRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1EDF7' }, note: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 14 },
  selector: { borderWidth: 1, borderColor: '#E5DCF3', borderRadius: 13, backgroundColor: '#FAF8FE', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }, selectorText: { color: colors.indigo, fontSize: 14, fontWeight: '600' }, options: { marginTop: 8, gap: 4 }, option: { padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memoryList: { marginTop: 12 }, memoryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1EDF7' }, memoryValue: { flex: 1, textAlign: 'right', color: colors.indigo, fontSize: 12, lineHeight: 19, marginTop: 5, fontWeight: '600' }, button: { borderRadius: 13, borderWidth: 1, borderColor: '#DDD0F1', padding: 15, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { color: colors.deep, fontSize: 13, fontWeight: '700' }, textButton: { padding: 14, alignItems: 'center' }, textButtonText: { fontSize: 12, color: colors.indigo, fontWeight: '600' }, smallButton: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1EAFB' }, pressed: { opacity: 0.5 },
  overlay: { flex: 1, backgroundColor: '#21123F80', justifyContent: 'center', alignItems: 'center', padding: 24 }, dialogScroll: { maxHeight: '90%', width: '100%', maxWidth: 400, flexGrow: 0, backgroundColor: '#FFFFFF', borderRadius: 24 }, dialog: { width: '100%', maxWidth: 400, padding: 24, borderRadius: 24, backgroundColor: '#FFFFFF' }, dialogTitle: { color: colors.deep, fontSize: 22, fontWeight: '700' }, input: { borderWidth: 1, borderColor: '#E5DCF3', borderRadius: 12, padding: 13, color: colors.text, backgroundColor: '#FAF8FE', marginTop: 8, fontSize: 14 }, error: { color: colors.deep, fontSize: 12, marginTop: 12 }, primaryButton: { backgroundColor: colors.purple, borderColor: colors.purple }, primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
