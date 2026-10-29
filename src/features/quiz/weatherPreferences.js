/**
 * @typedef {{answers?: {q5?: {coldOutfits?: string[], coldSensitivity?: string}, q6?: {hotOutfits?: string[], coverage?: string}, q7?: {rainProtection?: string}}}} WeatherProfile
 * @typedef {{field: 'warmth' | 'coverage' | 'waterproof', value: string | boolean, source: string, categories?: string[]}} WeatherPreference
 */
/** @param {WeatherProfile | null} profile @param {string} condition */
// These are stated preferences from individual quiz scenarios, not learned frequencies.
function getWeatherPreferences(profile, condition) {
  const answers = profile?.answers || {};
  /** @type {WeatherPreference[]} */
  const preferences = [];
  /** @param {WeatherPreference["field"]} field @param {string | boolean} value @param {string} source */
  const add = (field, value, source) => preferences.push({ field, value, source });
  if (condition === 'cold') {
    const choices = answers.q5?.coldOutfits || [];
    if (choices.includes('shorts-light-top') || choices.includes('light-layers')) {
      add('warmth', 'Light', 'your light-clothing choice in the cold-weather question');
    }
    if (choices.includes('warm-layers') || choices.includes('coat-and-boots')) {
      add('warmth', 'Warm', 'your warm-clothing choice in the cold-weather question');
    }
    if (choices.includes('shorts-light-top') && !choices.some((choice) => ['warm-layers', 'coat-and-boots'].includes(choice))) {
      preferences.push({ field: 'coverage', value: 'Minimal', categories: ['bottom'], source: 'your shorts choice in the cold-weather question' });
    }
    // Use sensitivity only when the user has not chosen an explicit outfit preference.
    if (!preferences.length && answers.q5?.coldSensitivity === 'very-cold') {
      add('warmth', 'Warm', 'your answer that you feel very cold');
    }
  }
  if (condition === 'hot') {
    const choices = answers.q6?.hotOutfits || [];
    if (choices.some((choice) => ['light-and-breezy', 'shorts-and-tee', 'light-coverage'].includes(choice))) {
      add('warmth', 'Light', 'your light-clothing choice in the hot-weather question');
    }
    /** @type {Record<string, string>} */
    const coverageOptions = { minimal: 'Minimal', moderate: 'Moderate', more: 'More' };
    const coverage = coverageOptions[answers.q6?.coverage || ''];
    if (coverage) add('coverage', coverage, 'your coverage preference in the hot-weather question');
  }
  if (condition === 'rainy' && answers.q7?.rainProtection === 'waterproof-layers') {
    add('waterproof', true, 'your preference for waterproof layers in rain');
  }
  return preferences;
}

/**
 * @param {{category: string, warmth?: string, coverage?: string, waterproof?: boolean}[]} items
 * @param {WeatherProfile | null} profile
 * @param {string} condition
 * @param {{warmth: string | null, source: string} | null} override
 */
function scorePersonalWeather(items, profile, condition, override = null) {
  let preferences = getWeatherPreferences(profile, condition);
  const learnedWarmth = override?.warmth;
  if (override && (learnedWarmth === 'Light' || learnedWarmth === 'Warm')) {
    preferences = preferences.filter((preference) => preference.field !== 'warmth');
    preferences.push({ field: 'warmth', value: learnedWarmth, source: override.source });
  }
  const dimensions = [...new Set(preferences.map(({ field }) => field))];
  const evidence = dimensions.flatMap((field) => {
    const choices = preferences.filter((preference) => preference.field === field);
    const known = items.filter((item) => {
      if (!choices.some((choice) => !choice.categories || choice.categories.includes(item.category))) return false;
      if (field === 'waterproof') return item.category === 'layer' && item.waterproof === true;
      return ['top', 'bottom', 'layer'].includes(item.category) &&
        (field === 'warmth' ? ['Light', 'Warm'] : ['Minimal', 'Moderate', 'More']).includes(item[field] || '');
    });
    if (!known.length) return [];
    const matched = known.filter((item) => choices.some(({ value, categories }) => value === item[field] && (!categories || categories.includes(item.category)))).length;
    return [{ field, matched, evaluated: known.length, sources: choices.map(({ source }) => source) }];
  });
  if (!evidence.length) return null;
  const matched = evidence.reduce((sum, entry) => sum + entry.matched, 0);
  const evaluated = evidence.reduce((sum, entry) => sum + entry.evaluated, 0);
  return {
    ratio: matched / evaluated,
    matched,
    evaluated,
    reason: `Personal weather match: ${matched} of ${evaluated} known garment details match ${[...new Set(evidence.flatMap(({ sources }) => sources))].join(' and ')}.`,
  };
}

module.exports = { getWeatherPreferences, scorePersonalWeather };
