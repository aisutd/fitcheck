const assert = require('node:assert/strict');
const { generateRecommendations, scorePreferenceFactors } = require('../src/features/suggest/outfitRecommendations');
const { getWeatherPreferences } = require('../src/features/quiz/weatherPreferences');
const { isWardrobeItem } = require('../src/features/wardrobe/wardrobeModel');
const wardrobe = [
  { id: 'light-top', category: 'top', warmth: 'Light', coverage: 'Minimal' },
  { id: 'warm-top', category: 'top', warmth: 'Warm', coverage: 'More' },
  { id: 'shorts', category: 'bottom', warmth: 'Light', coverage: 'Minimal' },
  { id: 'trousers', category: 'bottom', warmth: 'Warm', coverage: 'More' },
  { id: 'shoes', category: 'shoes' },
].map((item) => ({ ...item, name: item.id, color: 'Black', available: true, occasions: ['Date Night'] }));
const profile = (choice) => ({ answers: {
  q4: { priorities: ['weather', 'comfort', 'style'] },
  q5: { coldOutfits: [choice], coldSensitivity: 'very-cold' },
} });
const options = { weatherCondition: 'cold' };
const light = generateRecommendations('Date Night', wardrobe, profile('shorts-light-top'), options).recommendations[0];
const warm = generateRecommendations('Date Night', wardrobe, profile('warm-layers'), options).recommendations[0];
assert.deepEqual(light.items.map((item) => item.id).sort(), ['light-top', 'shoes', 'shorts']);
assert.deepEqual(warm.items.map((item) => item.id).sort(), ['shoes', 'trousers', 'warm-top']);
assert.equal(light.factors.find((factor) => factor.id === 'weather').weight, 6);
assert.ok(light.reasons.some((reason) => reason.includes('cold-weather question')));
assert.equal(scorePreferenceFactors([{ category: 'top', name: 'Warm coat' }], profile('warm-layers'), 'cold').score, null);
assert.equal(getWeatherPreferences(profile('warm-layers'), 'mild').length, 0);
assert.equal(getWeatherPreferences(profile('warm-layers'), '').length, 0);
assert.equal(scorePreferenceFactors(wardrobe, null, 'cold').score, null);
const both = profile('shorts-light-top');
both.answers.q5.coldOutfits.push('warm-layers');
assert.equal(scorePreferenceFactors(wardrobe, both, 'cold').score, 100);
const hot = { answers: { q6: { coverage: 'more' } } };
assert.equal(generateRecommendations('Date Night', wardrobe, hot, { weatherCondition: 'hot' }).recommendations[0].items.find((item) => item.category === 'bottom').id, 'trousers');
assert.ok(isWardrobeItem(wardrobe[0]));
assert.ok(!isWardrobeItem({ ...wardrobe[0], warmth: 'guess' }));
const unavailable = wardrobe.map((item) => ({ ...item, available: item.id !== 'shorts' }));
assert.ok(generateRecommendations('Date Night', unavailable, profile('shorts-light-top'), options).recommendations.every((outfit) => outfit.items.every((item) => item.id !== 'shorts')));
assert.equal(generateRecommendations('Work', wardrobe, profile('warm-layers'), options).recommendations.length, 0);
console.log('Passed personal weather preference checks: contrasting Date Night profiles, evidence, weighting, unknown metadata, mixed choices, hot coverage, validation, availability and occasion constraints.');
