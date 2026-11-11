const { WARDROBE, generateRecommendations } = require('../suggest/outfitRecommendations');
const priorities = { priorities: ['weather', 'comfort', 'style'] };
const cases = [
  { id: 'cold-light', weather: 'cold', answers: { q4: priorities, q5: { coldOutfits: ['shorts-light-top'] } },
    expected: 'Light top and shorts in cold weather',
    matches: (items) => items.some((item) => item.id === 'bottom-tailored-shorts') && items.some((item) => item.category === 'top' && item.warmth === 'Light') },
  { id: 'cold-warm', weather: 'cold', answers: { q4: priorities, q5: { coldOutfits: ['warm-layers'] } },
    expected: 'Warm top and covered bottoms in cold weather',
    matches: (items) => items.some((item) => item.category === 'top' && item.warmth === 'Warm') && items.some((item) => item.category === 'bottom' && item.warmth === 'Warm') },
  { id: 'hot-coverage', weather: 'hot', answers: { q4: priorities, q6: { coverage: 'more' } },
    expected: 'More coverage even in hot weather',
    matches: (items) => items.filter((item) => ['top', 'bottom'].includes(item.category)).every((item) => item.coverage === 'More') },
  { id: 'rain-layer', weather: 'rainy', answers: { q4: priorities, q7: { rainProtection: 'waterproof-layers' } },
    expected: 'Explicitly waterproof sample layer in rain',
    matches: (items) => items.some((item) => item.category === 'layer' && item.waterproof === true) },
];
function evaluateCheckpoint() {
  const rows = cases.map((scenario) => {
    const options = { weatherCondition: scenario.weather };
    const baseline = generateRecommendations('Date Night', WARDROBE, null, options).recommendations[0];
    const personalized = generateRecommendations('Date Night', WARDROBE, { answers: scenario.answers }, options).recommendations[0];
    const valid = personalized.items.every((item) => WARDROBE.some((owned) => owned.id === item.id) && item.occasions.includes('Date Night'));
    return {
      scenario: scenario.id, weather: scenario.weather, expected: scenario.expected,
      baselineItems: baseline.items.map((item) => item.id),
      personalizedItems: personalized.items.map((item) => item.id),
      baselineMatchesScenario: scenario.matches(baseline.items),
      personalizedMatchesScenario: scenario.matches(personalized.items),
      wardrobeAndOccasionValid: valid,
      reasons: personalized.reasons,
    };
  });
  return { evaluation: 'Controlled behavioral checks using authored sample data',
    limitation: 'Not a human preference study, model accuracy estimate, or Polyvore evaluation.',
    cases: rows, passed: rows.filter((row) => row.personalizedMatchesScenario && row.wardrobeAndOccasionValid).length, total: rows.length };
}
module.exports = { evaluateCheckpoint };
