const assert = require('node:assert/strict');
const { OCCASIONS, WARDROBE, recommendOutfit } = require('../src/features/suggest/outfitRecommendations');

let checks = 0;

function verifyRecommendation(occasion, wardrobe, attempt) {
  const wardrobeIds = new Set(wardrobe.map((item) => item.id));
  const outfit = recommendOutfit(occasion, wardrobe, [], attempt);

  if (outfit.items.length === 0) {
    assert.ok(outfit.message.length > 0, `${occasion} should explain why no outfit is available`);
    checks += 1;
    return;
  }

  const itemIds = outfit.items.map((item) => item.id);
  const categories = outfit.items.map((item) => item.category);

  assert.equal(new Set(itemIds).size, itemIds.length, 'an outfit must not repeat an item');
  assert.ok(itemIds.every((id) => wardrobeIds.has(id)), 'every returned ID must exist in the wardrobe');
  assert.ok(categories.includes('top'), 'a complete outfit needs a top');
  assert.ok(categories.includes('bottom'), 'a complete outfit needs a bottom');
  assert.ok(categories.includes('shoes'), 'a complete outfit needs shoes');
  assert.ok(outfit.items.every((item) => item.occasions.includes(occasion)));
  assert.ok(categories.filter((category) => category === 'layer').length <= 1);
  checks += 1;
}

for (const wardrobeSize of [0, 1, 5, 10, 15, 20, WARDROBE.length]) {
  const wardrobe = WARDROBE.slice(0, wardrobeSize);

  for (const occasion of OCCASIONS) {
    verifyRecommendation(occasion, wardrobe, wardrobeSize);
  }
}

for (const occasion of OCCASIONS) {
  const firstOutfit = recommendOutfit(occasion, WARDROBE, [], 0);
  const nextOutfit = recommendOutfit(
    occasion,
    WARDROBE,
    firstOutfit.items.map((item) => item.id),
    1,
  );

  assert.ok(firstOutfit.items.length >= 3, `${occasion} should have a complete sample outfit`);
  assert.ok(nextOutfit.items.length >= 3, `${occasion} should have another complete sample outfit`);
  assert.notDeepEqual(
    nextOutfit.items.map((item) => item.id).sort(),
    firstOutfit.items.map((item) => item.id).sort(),
    `${occasion} should generate a different combination`,
  );
  verifyRecommendation(occasion, WARDROBE, 1);
}

const duplicateIdWardrobe = [
  ...WARDROBE.filter((item) => item.occasions.includes('Work')),
  WARDROBE.find((item) => item.occasions.includes('Work')),
];
verifyRecommendation('Work', duplicateIdWardrobe, 2);

console.log(`Passed ${checks} recommendation validity checks.`);