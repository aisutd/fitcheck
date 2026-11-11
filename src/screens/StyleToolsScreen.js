import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStyleMemory, updateStyleMemory, loadStyleMemory } from '../features/suggest/styleMemoryStore';
import { weatherLesson, resolveSavedLook } from '../features/suggest/styleMemoryModel';
import { OCCASIONS } from '../features/suggest/occasions';
import { planTravel } from '../features/suggest/travelPlanner';
import { WARDROBE } from '../features/suggest/outfitRecommendations';
import { loadWardrobeState } from '../features/wardrobe/wardrobeStorage';
import { loadQuizState } from '../features/quiz/quizStorage';

function Action({ label, onPress, disabled = false, selected = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
    style={[styles.button, selected && styles.selected, disabled && styles.disabled]}><Text style={[styles.buttonText, selected && styles.white]}>{label}</Text></Pressable>;
}
export default function StyleToolsScreen({ mode, onClose }) {
  const memory = useStyleMemory();
  const [tab, setTab] = useState('memory');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [context, setContext] = useState(null);
  const [contextError, setContextError] = useState('');
  const [contextAttempt, setContextAttempt] = useState(0);
  const [days, setDays] = useState([{ occasion: 'Casual', weather: '' }, { occasion: 'Date Night', weather: '' }]);
  const [plan, setPlan] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([loadWardrobeState(), loadQuizState()]).then(([wardrobe, quiz]) => {
      if (!active) return;
      const records = mode === 'demo' ? WARDROBE.map((item) => ({ ...item, available: wardrobe.state.demoAvailability[item.id] !== false })) : wardrobe.state.personalItems;
      setContext({ records, profile: quiz.profile }); setContextError('');
    }).catch((error) => { if (active) setContextError(error.message); });
    return () => { active = false; };
  }, [mode, contextAttempt]);
  async function change(operation, message) {
    setBusy(true); setNotice('');
    try { await updateStyleMemory(operation); setNotice(message); setPlan(null); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  function updateDay(index, field, value) {
    setDays((current) => current.map((day, i) => i === index ? { ...day, [field]: value } : day)); setPlan(null);
  }
  const observations = memory.data.feedback.filter((entry) => entry.mode === mode);
  const contexts = [...new Set(observations.filter((entry) => entry.weather).map((entry) => `${entry.occasion}|${entry.weather}`))];
  const saved = memory.data.saved.filter((look) => look.mode === mode);
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>FITCHECK · {mode.toUpperCase()} MODE</Text><Action label="Back to outfits" onPress={onClose} /></View>
    <Text accessibilityRole="header" style={styles.title}>More you, over time.</Text>
    <Text style={styles.copy}>Your feedback and saved looks stay on this device. Personal and Demo records are separate.</Text>
    <View style={styles.row}>{[['memory', 'Style memory'], ['saved', 'Saved looks'], ['travel', 'Travel capsule']].map(([id, label]) => <Action key={id} label={label} selected={tab === id} onPress={() => setTab(id)} />)}</View>
    {notice || memory.error || contextError ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{[notice, memory.error, contextError].filter(Boolean).join(' · ')}</Text> : null}
    {contextError ? <Action label="Retry wardrobe and profile" onPress={() => { setContext(null); setContextError(''); setContextAttempt((value) => value + 1); }} /> : null}
    {!memory.ready ? <Action label="Retry style memory" onPress={loadStyleMemory} /> : null}
    {tab === 'memory' ? <>
      <View style={styles.card}><Text style={styles.heading}>You decide what FitCheck learns.</Text>
        <Text style={styles.copy}>Comfort feedback is grouped by occasion and weather. After at least three observations, a two-thirds agreement can suggest lighter or warmer clothing. One look gets one comfort observation per day; changing your answer replaces it.</Text>
        <Text style={styles.copy}>Enable this only after reviewing the evidence below. A supported weather preference then takes precedence over the quiz’s warmth choice for that context. Your quiz answers stay unchanged. While enabled, future supported patterns also apply automatically. Style likes only break equal-score ties.</Text>
        <Action label={memory.data.enabled[mode] ? 'Learning is on · turn off' : 'Apply reviewed feedback · currently off'} disabled={!memory.ready || busy}
          selected={memory.data.enabled[mode]} onPress={() => change((state) => ({ ...state, enabled: { ...state.enabled, [mode]: !state.enabled[mode] } }), 'Feedback preference updated. Your saved quiz is unchanged.')} />
      </View>
      {contexts.map((key) => {
        const [occasion, weather] = key.split('|'); const lesson = weatherLesson(memory.data, mode, occasion, weather);
        return <View key={key} style={styles.card}><Text style={styles.heading}>{occasion} · {weather}</Text>
          <Text style={styles.copy}>{lesson.count} observations: {lesson.light} too warm, {lesson.warm} too cold, {lesson.comfortable} comfortable.</Text>
          <Text style={styles.copy}>{lesson.warmth ? `Supported preference: ${lesson.warmth === 'Light' ? 'lighter' : 'warmer'} clothing.` : 'No consistent preference yet. More observations or clearer agreement are needed.'}</Text></View>;
      })}
      {!observations.length ? <Text style={styles.copy}>No feedback recorded yet. Try Like this, Not my style, or a comfort response on an outfit.</Text> : null}
      {observations.slice(0, 30).map((entry) => <View key={entry.id} style={styles.card}><Text style={styles.heading}>{entry.occasion} · {entry.weather || 'weather not set'}</Text>
        <Text style={styles.copy}>{context ? entry.signature.split('|').map((id) => context.records.find((item) => item.id === id)?.name || 'Unavailable piece').join(' + ') : 'Outfit details unavailable'}</Text>
        <Text style={styles.copy}>{entry.kind.replace(/-/g, ' ')} · {new Date(entry.at).toLocaleDateString()}</Text>
        <Action label="Remove this observation" disabled={busy} onPress={() => change((state) => ({ ...state, feedback: state.feedback.filter((item) => item.id !== entry.id) }), 'Observation removed; preferences recalculated.')} /></View>)}
      {observations.length > 30 ? <Text style={styles.copy}>Showing the 30 most recent observations. Up to 200 are retained across modes.</Text> : null}
    </> : null}
    {tab === 'saved' ? <>
      {!saved.length ? <Text style={styles.copy}>Save a look from Suggest to find it here.</Text> : null}
      {saved.map((look) => {
        const resolved = context ? resolveSavedLook(look, context.records) : null;
        return <View key={look.key} style={styles.card}><Text style={styles.heading}>{look.occasion} · {look.weather || 'any weather'}</Text>
          {(resolved?.items || look.items).map((item) => <Text key={item.id} style={styles.copy}>{item.name}{resolved && !item.available ? ' · unavailable or no longer tagged for this occasion' : ''}</Text>)}
          <Text style={styles.copy}>{!resolved ? 'Current availability has not been checked.' : resolved.available ? 'All pieces are currently available.' : 'This look needs attention before wearing.'}</Text>
          <Action label="Remove saved look" disabled={busy || !memory.ready} onPress={() => change((state) => ({ ...state, saved: state.saved.filter((item) => item.key !== look.key) }), 'Saved look removed. Wardrobe pieces are unchanged.')} /></View>;
      })}
    </> : null}
    {tab === 'travel' ? <>
      <Text style={styles.heading}>Pack less. Rewear thoughtfully.</Text>
      <Text style={styles.copy}>Plan up to five days. FitCheck minimizes distinct pieces among each day’s top three complete suggestions, using your available {mode === 'demo' ? 'sample' : 'personal'} wardrobe. Weather is entered manually. It does not model laundry, luggage size or forecasts.</Text>
      {days.map((day, index) => <View key={index} style={styles.card}><Text style={styles.heading}>Day {index + 1}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.row}>{OCCASIONS.map((occasion) => <Action key={occasion} label={occasion} selected={day.occasion === occasion} onPress={() => updateDay(index, 'occasion', occasion)} />)}</View></ScrollView>
        <View style={styles.row}>{['', 'cold', 'mild', 'hot', 'rainy'].map((weather) => <Action key={weather} label={weather || 'Weather not set'} selected={day.weather === weather} onPress={() => updateDay(index, 'weather', weather)} />)}</View>
      </View>)}
      <View style={styles.row}><Action label="Add day" disabled={days.length >= 5} onPress={() => { setDays((current) => [...current, { occasion: 'Casual', weather: '' }]); setPlan(null); }} />
        <Action label="Remove last day" disabled={days.length <= 1} onPress={() => { setDays((current) => current.slice(0, -1)); setPlan(null); }} /></View>
      <Action label={context ? 'Build my capsule' : contextError ? 'Wardrobe unavailable' : 'Loading wardrobe…'} disabled={!context || !memory.ready} onPress={() => {
        try { setPlan(planTravel(days, context.records.filter((item) => item.available !== false), context.profile, { memory: memory.data, mode })); setNotice(''); }
        catch (error) { setNotice(error.message); }
      }} />
      {plan?.missingDays.length ? <Text style={styles.notice}>No complete outfit for day(s) {plan.missingDays.join(', ')}. Add suitable occasion tags or available clothing; no pieces were invented.</Text> : null}
      {plan?.items.length ? <View style={styles.card}><Text style={styles.heading}>{plan.items.length} pieces for {days.length} days</Text>
        {plan.items.map((item) => <Text key={item.id} style={styles.copy}>{item.name} · day {item.days.join(', ')}</Text>)}
        {plan.outfits.map((look, index) => <View key={index} style={styles.day}><Text style={styles.heading}>Day {index + 1} · {days[index].occasion}</Text><Text style={styles.copy}>{look.items.map((item) => item.name).join(' + ')}</Text></View>)}
      </View> : null}
    </> : null}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F1F4EF' }, content: { padding: 22, paddingBottom: 50, maxWidth: 650, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, eyebrow: { color: '#627A68', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  title: { fontFamily: 'serif', fontSize: 34, color: '#202B27', marginTop: 20, marginBottom: 10 }, heading: { color: '#27483C', fontSize: 15, fontWeight: '700', marginBottom: 7 },
  copy: { color: '#6C7771', fontSize: 12, lineHeight: 19, marginVertical: 4 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  button: { minHeight: 44, borderWidth: 1, borderColor: '#DCE3DC', borderRadius: 9, paddingHorizontal: 12, justifyContent: 'center', marginVertical: 4 },
  buttonText: { color: '#27483C', fontSize: 12, fontWeight: '700' }, selected: { backgroundColor: '#27483C' }, white: { color: '#FFFFFF' }, disabled: { opacity: 0.5 },
  card: { padding: 15, backgroundColor: '#FAFBF8', borderWidth: 1, borderColor: '#DCE3DC', borderRadius: 12, marginVertical: 10 }, notice: { color: '#9B3F35', fontSize: 12, lineHeight: 19, marginVertical: 12 }, day: { marginTop: 16 },
});
