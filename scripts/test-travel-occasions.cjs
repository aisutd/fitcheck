const assert = require('node:assert/strict');
const { generateRecommendations, recommendOutfit, WARDROBE } = require('../src/features/suggest/outfitRecommendations');
const { planTravel } = require('../src/features/suggest/travelPlanner');
const { isWardrobeItem } = require('../src/features/wardrobe/wardrobeModel');
for (const occasion of ['Concert', 'Travel', 'Sleepwear']) {
 const result = generateRecommendations(occasion, WARDROBE);
 assert.ok(result.recommendations.length);
 assert.ok(result.recommendations.every((look) => look.complete && look.items.every((item) => item.occasions.includes(occasion))));
 assert.ok(WARDROBE.filter((item) => item.occasions.includes(occasion)).every((item) => isWardrobeItem({ ...item, available: true })));
}
const sleep = WARDROBE.filter((item) => item.occasions.includes('Sleepwear'));
assert.ok(generateRecommendations('Sleepwear', sleep).recommendations.every((look) => look.complete && !look.items.some((item) => item.category === 'shoes')));
assert.equal(recommendOutfit('Sleepwear', sleep).items.length, 2);
const days = [{ occasion: 'Casual' }, { occasion: 'Casual' }];
const plan = planTravel(days, WARDROBE);
assert.equal(plan.outfits.length, 2);
assert.equal(plan.items.length, plan.outfits[0].items.length, 'reuse the same top-ranked complete outfit when that packs fewer pieces');
assert.ok(plan.items.every((item) => item.days.length === 2));
assert.equal(planTravel(days, []).missingDays.length, 2);
assert.equal(planTravel(days, WARDROBE.map((item) => ({ ...item, available: false }))).outfits.length, 0);
assert.throws(() => planTravel([], WARDROBE));
assert.throws(() => planTravel(Array(6).fill(days[0]), WARDROBE));
console.log('Passed new occasion tagging, optional sleepwear shoes, travel reuse, missing/unavailable items and day-limit checks.');
