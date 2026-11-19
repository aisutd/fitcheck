const assert = require('node:assert/strict');
const { emptyStyleMemory, validStyleMemory, recordFeedback, weatherLesson, styleAffinity, toggleSavedLook, resolveSavedLook } = require('../src/features/suggest/styleMemoryModel');
const { generateRecommendations } = require('../src/features/suggest/outfitRecommendations');
let state = emptyStyleMemory();
const context = { mode: 'personal', occasion: 'Date Night', weather: 'cold', signature: 'look-1' };
state = recordFeedback(state, context, 'too-warm', '2026-10-28T10:00:00Z');
state = recordFeedback(state, context, 'too-cold', '2026-10-28T11:00:00Z');
assert.equal(state.feedback.length, 1, 'same look/day replaces comfort feedback');
assert.equal(weatherLesson(state, 'personal', 'Date Night', 'cold').warmth, null);
state = recordFeedback(state, context, 'too-warm', '2026-10-29T10:00:00Z');
state = recordFeedback(state, context, 'too-warm', '2026-10-30T10:00:00Z');
assert.equal(weatherLesson(state, 'personal', 'Date Night', 'cold').warmth, 'Light');
assert.equal(weatherLesson(state, 'demo', 'Date Night', 'cold').count, 0);
assert.equal(weatherLesson(state, 'personal', 'Work', 'cold').count, 0);
state = recordFeedback(state, context, 'like');
assert.equal(styleAffinity(state, 'personal', 'Date Night', 'cold', 'look-1'), 0);
state = { ...state, enabled: { ...state.enabled, personal: true } };
assert.equal(styleAffinity(state, 'personal', 'Date Night', 'cold', 'look-1'), 1);
const items = [{ id: 'a', name: 'A', category: 'top' }, { id: 'b', name: 'B', category: 'bottom' }, { id: 'c', name: 'C', category: 'shoes' }];
assert.throws(() => toggleSavedLook(state, context, items.slice(0, 2)), /Complete/);
state = toggleSavedLook(state, context, items);
assert.equal(state.saved.length, 1);
assert.equal(resolveSavedLook(state.saved[0], [{ ...items[0], available: true, occasions: ['Date Night'] }]).available, false);
assert.equal(resolveSavedLook(state.saved[0], items.map((item) => ({ ...item, available: true, occasions: ['Date Night'] }))).available, true);
assert.ok(validStyleMemory(JSON.parse(JSON.stringify(state))));
state = toggleSavedLook(state, context, items);
assert.equal(state.saved.length, 0);
assert.throws(() => recordFeedback(state, { ...context, weather: '' }, 'too-warm'));
const wardrobe = [
 { id: 'a-light', name: 'Light top', category: 'top', warmth: 'Light' },
 { id: 'b-warm', name: 'Warm top', category: 'top', warmth: 'Warm' },
 { id: 'bottom', name: 'Bottom', category: 'bottom' }, { id: 'shoes', name: 'Shoes', category: 'shoes' },
].map((item) => ({ ...item, color: 'Black', available: true, occasions: ['Date Night'] }));
const profile = { answers: { q4: { priorities: ['weather', 'comfort', 'style'] }, q5: { coldOutfits: ['warm-layers'] } } };
const profileBefore = JSON.stringify(profile);
const disabled = { ...state, enabled: { personal: false, demo: false } };
assert.ok(generateRecommendations('Date Night', wardrobe, profile, { weatherCondition: 'cold', memory: disabled, mode: 'personal' }).recommendations[0].items.some((item) => item.id === 'b-warm'));
assert.ok(generateRecommendations('Date Night', wardrobe, profile, { weatherCondition: 'cold', memory: state, mode: 'personal' }).recommendations[0].items.some((item) => item.id === 'a-light'));
assert.ok(generateRecommendations('Date Night', wardrobe, profile, { weatherCondition: 'cold', memory: state, mode: 'demo' }).recommendations[0].items.some((item) => item.id === 'b-warm'));
assert.equal(JSON.stringify(profile), profileBefore, 'learning does not rewrite the saved quiz');
console.log('Passed feedback deduplication, evidence thresholds, approval/mode isolation, saved-look resolution and learned ranking checks.');
