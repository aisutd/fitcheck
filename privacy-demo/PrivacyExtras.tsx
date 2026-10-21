import React, { useEffect, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportCloset } from './exportCloset';
import { MockData } from './privacyData';
import { initialDemoRecords, retentionOptions, usePrivacyPreference } from './lib/privacyPreferences';

type ToggleComponent = React.ComponentType<{ enabled: boolean; onChange: () => void; label?: string; disabled?: boolean }>;
type Props = { data: MockData; setData: React.Dispatch<React.SetStateAction<MockData>>; notify: (message: string) => void; Toggle: ToggleComponent };
const colors = { purple: '#9765E0', lavender: '#CE95FB', teal: '#00C2BA', indigo: '#534FA5', deep: '#36009C', text: '#29233F', muted: '#837C96' };
type IconName = React.ComponentProps<typeof Ionicons>['name'];

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
function ToggleRow({ title, description, enabled, onChange, Toggle, disabled = false }: { title: string; description: string; enabled: boolean; onChange: () => void; Toggle: ToggleComponent; disabled?: boolean }) {
  return <View style={s.settingRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.description}>{description}</Text></View><Toggle label={title} enabled={enabled} onChange={onChange} disabled={disabled} /></View>;
}

type SavedBooleanField = 'blur_faces' | 'blur_background' | 'strip_location' | 'personalized_suggestions' | 'retailer_sharing';
function SavedToggle({ field, initial, title, description, Toggle }: { field: SavedBooleanField; initial: boolean; title: string; description: string; Toggle: ToggleComponent }) {
  const preference = usePrivacyPreference(field, initial);
  return <>
    <ToggleRow title={title} description={description} enabled={preference.value} disabled={preference.state !== 'ready'} onChange={() => { void preference.save(!preference.value); }} Toggle={Toggle} />
    <Text accessibilityLiveRegion="polite" style={s.description}>{preference.message}</Text>
    {preference.state === 'error' && <Pressable accessibilityRole="button" accessibilityLabel={`Retry ${title}`} style={s.textButton} onPress={preference.retry}><Text style={s.textButtonText}>Retry</Text></Pressable>}
  </>;
}

export function PhotoRetentionSettings() {
  const preference = usePrivacyPreference('photo_retention', 'After processing');
  const retention = preference.value;
  const [open, setOpen] = useState(false);
  return <Card title="Try-On Photo Retention" description="Choose when your original try-on photos should be removed." icon="timer-outline">
    <Pressable accessibilityRole="button" accessibilityLabel={`Try-on photo retention: ${retention}`} accessibilityState={{ expanded: open, disabled: preference.state !== 'ready' }} disabled={preference.state !== 'ready'} style={s.selector} onPress={() => setOpen(value => !value)}><Text style={s.selectorText}>{retention}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.indigo} /></Pressable>
    {open && <Animated.View style={s.options}>{retentionOptions.map(option => <Pressable accessibilityRole="button" accessibilityState={{ selected: retention === option }} key={option} style={[s.option, retention === option && { backgroundColor: '#F1EAFB' }]} onPress={() => { setOpen(false); void preference.save(option); }}><Text style={s.rowTitle}>{option}</Text>{retention === option && <Ionicons name="checkmark-circle" color={colors.purple} size={20} />}</Pressable>)}</Animated.View>}
    <Text accessibilityLiveRegion="polite" style={s.description}>{preference.message}</Text>
    {preference.state === 'error' && <Pressable accessibilityRole="button" onPress={preference.retry} style={s.textButton}><Text style={s.textButtonText}>Retry photo retention</Text></Pressable>}
    <Text style={s.note}>Preference saved to your account. Automatic photo deletion will apply when photo processing is connected.</Text>
  </Card>;
}

export function PrivacyExtras({ data, setData, notify, Toggle }: Props) {
  const trainingPreference = usePrivacyPreference('ai_training_consent', false);
  const training = trainingPreference.value;





  const records = usePrivacyPreference('demo_records', initialDemoRecords);
  useEffect(() => { setData(previous => ({ ...previous, ...records.value })); }, [records.value, setData]);
  const memory = usePrivacyPreference('saved_memory', { style: '', size: '', budget: '' });
  useEffect(() => { setData(previous => ({ ...previous, memory: memory.value })); }, [memory.value, setData]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.memory);
  const [error, setError] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<DeleteKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteBusy = React.useRef(false);
  async function deleteCategory() {
    if (!deleteKey || deleteBusy.current || records.state !== 'ready') return;
    deleteBusy.current = true;
    setDeleting(true);
    try {
      const next = { ...records.value, [deleteKey]: [], ...(deleteKey === 'closet' ? { outfits: [] } : {}) };
      const saved = await records.save(next);
      if (saved) { setDeleteKey(null); notify(`${deleteName} deleted from your saved demo records.`); }
    } finally { deleteBusy.current = false; setDeleting(false); }
  }
  const deleteName = deletable.find(item => item.key === deleteKey)?.name;
  const saveMemory = async () => {
    if (draft.budget.trim() && (!/^\d+(\.\d{1,2})?$/.test(draft.budget.trim()) || Number(draft.budget) <= 0)) {
      setError('Enter a budget greater than zero, or leave it empty.'); return;
    }
    const saved = await memory.save({ style: draft.style.trim(), size: draft.size.trim(), budget: draft.budget.trim() });
    if (saved) { setEditing(false); setError(null); notify('Your saved preferences have been updated.'); }
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
      <ToggleRow title="Allow AI training" description={training ? 'You allow AI training.' : 'AI training is not allowed.'} enabled={training} disabled={trainingPreference.state !== 'ready'} onChange={() => { void trainingPreference.save(!training); }} Toggle={Toggle} />
      <Text accessibilityLiveRegion="polite" style={s.description}>{trainingPreference.message}</Text>
      {trainingPreference.state === 'error' && <Pressable accessibilityRole="button" onPress={trainingPreference.retry} style={s.textButton}><Text style={s.textButtonText}>Retry AI consent</Text></Pressable>}
      <Text style={s.note}>Consent is saved and can be withdrawn here. No AI provider is connected; no photos or chats are sent for training.</Text>
    </Card>
    <Card title="Photo Protection" description="Preview safeguards to apply before a photo leaves your device." icon="eye-off-outline">
      <SavedToggle title="Blur faces" description="Conceal faces in clothing photos." field="blur_faces" initial={true} Toggle={Toggle} />
      <SavedToggle title="Hide the background" description="Keep your room and surroundings out of view." field="blur_background" initial={true} Toggle={Toggle} />
      <SavedToggle title="Remove location metadata" description="Strip embedded GPS information." field="strip_location" initial={true} Toggle={Toggle} />
      <Text style={s.note}>Your protection preferences are saved. Image editing and metadata removal will apply when photo processing is connected.</Text>
    </Card>
    <Text style={s.section}>SHOPPING & PERSONALIZATION</Text>
    <Card title="Shopping Privacy" description="Keep helpful recommendations on your terms." icon="bag-handle-outline">
      <SavedToggle title="Personalized suggestions" description="Use your saved style and budget to tailor recommendations." field="personalized_suggestions" initial={true} Toggle={Toggle} />
      <SavedToggle title="Share preferences with retailers" description="Separate permission to share style and budget with shopping partners." field="retailer_sharing" initial={false} Toggle={Toggle} />
      <Text style={s.note}>Your shopping preferences are saved. No retailer or recommendation service is connected.</Text>
    </Card>
    <Card title="What Fitcheck Remembers" description="Review, edit, or forget your saved preferences." icon="bulb-outline">
      <Text accessibilityLiveRegion="polite" style={s.description}>{memory.message}</Text>
      {memory.state === 'error' && <Pressable accessibilityRole="button" style={s.textButton} onPress={memory.retry}><Text style={s.textButtonText}>Retry saved preferences</Text></Pressable>}
      <View style={s.memoryList}>{[['Style', data.memory.style || 'Not saved'], ['Size', data.memory.size || 'Not saved'], ['Budget per item', data.memory.budget ? `$${data.memory.budget}` : 'Not saved']].map(([label, value]) => <View key={label} style={s.memoryRow}><Text style={s.description}>{label}</Text><Text style={s.memoryValue}>{value}</Text></View>)}</View>
      <Pressable accessibilityRole="button" disabled={memory.state !== 'ready'} style={({ pressed }) => [s.button, (pressed || memory.state !== 'ready') && s.pressed]} onPress={() => { setDraft({ ...data.memory }); setError(null); setEditing(true); }}><Ionicons name="create-outline" size={18} color={colors.deep} /><Text style={s.buttonText}>Edit preferences</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={memory.state !== 'ready' || !Object.values(data.memory).some(Boolean)} style={({ pressed }) => [s.textButton, (pressed || !Object.values(data.memory).some(Boolean)) && s.pressed]} onPress={() => { void memory.save({ style: '', size: '', budget: '' }).then(saved => { if (saved) notify('Your saved preferences have been forgotten.'); }); }}><Text style={s.textButtonText}>Forget all preferences</Text></Pressable>
    </Card>
    <Text style={s.section}>MANAGE YOUR DATA</Text>
    <Card title="Delete by Category" description="Delete the saved demo records in one category." icon="trash-outline">
      <Text accessibilityLiveRegion="polite" style={s.description}>{records.message}</Text>
      {records.state === 'error' && <Pressable accessibilityRole="button" style={s.textButton} onPress={records.retry}><Text style={s.textButtonText}>Retry saved records</Text></Pressable>}
      {deletable.map(item => <View key={item.key} style={s.settingRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{item.name}</Text><Text style={s.description}>{data[item.key].length} mock {data[item.key].length === 1 ? 'record' : 'records'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name.toLowerCase()}`} disabled={records.state !== 'ready' || !data[item.key].length} onPress={() => setDeleteKey(item.key)} style={({ pressed }) => [s.smallButton, (pressed || !data[item.key].length) && s.pressed]}><Text style={s.textButtonText}>{data[item.key].length ? 'Delete' : 'Cleared'}</Text></Pressable></View>)}
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
        <Text accessibilityLiveRegion="polite" style={s.description}>{memory.message}</Text>
        <Pressable accessibilityRole="button" style={[s.button, s.primaryButton]} disabled={memory.state !== 'ready'} onPress={() => { void saveMemory(); }}><Text style={s.primaryText}>Save preferences</Text></Pressable><Pressable accessibilityRole="button" style={s.textButton} onPress={() => setEditing(false)}><Text style={s.textButtonText}>Cancel</Text></Pressable>
      </ScrollView></View>
    </Modal>
    <Modal visible={deleteKey !== null} transparent animationType="fade" onRequestClose={() => setDeleteKey(null)}>
      <View style={s.overlay}><Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Cancel deletion" onPress={() => setDeleteKey(null)} /><View style={s.dialog} accessibilityViewIsModal><Text style={s.dialogTitle}>Delete {deleteName?.toLowerCase()}?</Text><Text style={s.description}>This removes only this category’s mock records in the current session.{deleteKey === 'closet' ? ' Saved outfits referencing these items will also be cleared.' : ''} There are no uploaded photo files in this demo.</Text>
        <Text accessibilityLiveRegion="polite" style={s.description}>{records.message}</Text>
        <Pressable accessibilityRole="button" disabled={deleting || records.state !== 'ready'} style={[s.button, s.primaryButton]} onPress={() => { void deleteCategory(); }}><Text style={s.primaryText}>{deleting ? 'Deleting...' : `Delete ${deleteName?.toLowerCase()}`}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={deleting} style={s.textButton} onPress={() => setDeleteKey(null)}><Text style={s.textButtonText}>Cancel</Text></Pressable>
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
