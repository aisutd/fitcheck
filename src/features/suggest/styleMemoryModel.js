const { OCCASIONS, requiredCategories } = require('./occasions');
const MODES = ['personal', 'demo'];
const WEATHER = ['', 'cold', 'mild', 'hot', 'rainy'];
const FEEDBACK = ['like', 'not-style', 'too-warm', 'too-cold', 'comfortable'];
function emptyStyleMemory() { return { version: 1, enabled: { personal: false, demo: false }, feedback: [], saved: [] }; }
function validContext(value) { return value && MODES.includes(value.mode) && OCCASIONS.includes(value.occasion) && WEATHER.includes(value.weather); }
function validTime(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
function validStyleMemory(state) {
  return Boolean(state && state.version === 1 && state.enabled && MODES.every((mode) => typeof state.enabled[mode] === 'boolean') &&
    Array.isArray(state.feedback) && state.feedback.length <= 200 && new Set(state.feedback.map((entry) => entry?.id)).size === state.feedback.length && state.feedback.every((entry) => validContext(entry) &&
      typeof entry.id === 'string' && typeof entry.signature === 'string' && FEEDBACK.includes(entry.kind) && validTime(entry.at)) &&
    Array.isArray(state.saved) && state.saved.length <= 50 && new Set(state.saved.map((entry) => entry?.key)).size === state.saved.length && state.saved.every((entry) => validContext(entry) && validTime(entry.at) && typeof entry.key === 'string' &&
      Array.isArray(entry.items) && entry.items.length > 0 && entry.items.every((item) => typeof item.id === 'string' && typeof item.name === 'string')));
}
function recordFeedback(state, context, kind, at = new Date().toISOString()) {
  if (!validContext(context) || !FEEDBACK.includes(kind) || !context.signature || !validTime(at)) throw new Error('Feedback needs a valid outfit and context.');
  if (['too-warm', 'too-cold', 'comfortable'].includes(kind) && !context.weather) throw new Error('Choose the weather context before recording comfort feedback.');
  const date = new Date(at);
  const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const dimension = ['like', 'not-style'].includes(kind) ? 'style' : 'comfort';
  const id = [context.mode, context.occasion, context.weather, context.signature, day, dimension].join('::');
  const entry = { ...context, kind, id, at };
  return { ...state, feedback: [entry, ...state.feedback.filter((item) => item.id !== id)].slice(0, 200) };
}
function weatherLesson(state, mode, occasion, weather) {
  const observations = state.feedback.filter((entry) => entry.mode === mode && entry.occasion === occasion && entry.weather === weather &&
    ['too-warm', 'too-cold', 'comfortable'].includes(entry.kind));
  const light = observations.filter((entry) => entry.kind === 'too-warm').length;
  const warm = observations.filter((entry) => entry.kind === 'too-cold').length;
  const count = observations.length;
  const warmth = count >= 3 && light / count >= 2 / 3 ? 'Light' : count >= 3 && warm / count >= 2 / 3 ? 'Warm' : null;
  return { count, light, warm, comfortable: count - light - warm, warmth,
    source: warmth ? `${count} recorded comfort observations for ${occasion} in ${weather} conditions` : '' };
}
function styleAffinity(state, mode, occasion, weather, signature) {
  if (!state.enabled[mode]) return 0;
  const latest = state.feedback.find((entry) => entry.mode === mode && entry.occasion === occasion && entry.weather === weather &&
    entry.signature === signature && ['like', 'not-style'].includes(entry.kind));
  return latest?.kind === 'like' ? 1 : latest?.kind === 'not-style' ? -1 : 0;
}
function toggleSavedLook(state, context, items, at = new Date().toISOString()) {
  if (!validContext(context) || !items.length || !items.every((item) => typeof item.id === 'string' && typeof item.name === 'string')) throw new Error('This outfit cannot be saved.');
  if (!requiredCategories(context.occasion).every((category) => items.some((item) => item.category === category))) throw new Error('Complete this outfit before saving it.');
  const signature = items.map((item) => item.id).sort().join('|');
  const key = [context.mode, context.occasion, signature].join('::');
  if (state.saved.some((entry) => entry.key === key)) return { ...state, saved: state.saved.filter((entry) => entry.key !== key) };
  if (state.saved.length >= 50) throw new Error('You have 50 saved looks. Remove one before saving another.');
  return { ...state, saved: [{ ...context, key, at, items: items.map(({ id, name }) => ({ id, name })) }, ...state.saved] };
}
function resolveSavedLook(look, wardrobe) {
  const items = look.items.map((saved) => {
    const current = wardrobe.find((item) => item.id === saved.id);
    return { ...saved, name: current?.name || saved.name, available: Boolean(current && current.available !== false && current.occasions?.includes(look.occasion)) };
  });
  return { ...look, items, available: items.every((item) => item.available) };
}
module.exports = { emptyStyleMemory, validStyleMemory, recordFeedback, weatherLesson, styleAffinity, toggleSavedLook, resolveSavedLook, FEEDBACK };
