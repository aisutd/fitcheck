const assert = require('node:assert/strict');
const {
  OCCASIONS,
  PRIORITY_WEIGHTS,
  WARDROBE,
  generateRecommendations,
  recommendOutfit,
  scorePreferenceFactors,
} = require('../src/features/suggest/outfitRecommendations');

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
  if (occasion !== 'Sleepwear') assert.ok(categories.includes('shoes'), 'a complete daytime outfit needs shoes');
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

  assert.ok(firstOutfit.items.length >= (occasion === 'Sleepwear' ? 2 : 3), `${occasion} should have a complete sample outfit`);
  assert.ok(nextOutfit.items.length >= (occasion === 'Sleepwear' ? 2 : 3), `${occasion} should have another complete sample outfit`);
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

let personalizedChecks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  personalizedChecks += 1;
}

const metadataWardrobe = [
  { id: 'top-neutral', name: 'Neutral shirt', category: 'top', color: 'Cream', colorFamily: 'Neutrals', fit: 'Regular', styleTags: ['minimalist'], weatherTags: ['cold'], occasions: ['Work'], available: true },
  { id: 'top-bright', name: 'Bright shirt', category: 'top', color: 'Red', colorFamily: 'Brights', fit: 'Oversized', styleTags: ['streetwear'], weatherTags: ['hot'], occasions: ['Work'], available: true },
  { id: 'bottom-neutral', name: 'Neutral trousers', category: 'bottom', color: 'Taupe', colorFamily: 'Neutrals', fit: 'Regular', styleTags: ['minimalist'], weatherTags: ['cold'], occasions: ['Work'], available: true },
  { id: 'bottom-bright', name: 'Bright trousers', category: 'bottom', color: 'Blue', colorFamily: 'Brights', fit: 'Oversized', styleTags: ['streetwear'], weatherTags: ['hot'], occasions: ['Work'], available: true },
  { id: 'shoes-neutral', name: 'Neutral shoes', category: 'shoes', color: 'Cream', colorFamily: 'Neutrals', styleTags: ['minimalist'], weatherTags: ['cold'], occasions: ['Work'], available: true },
  { id: 'shoes-bright', name: 'Bright shoes', category: 'shoes', color: 'Red', colorFamily: 'Brights', styleTags: ['streetwear'], weatherTags: ['hot'], occasions: ['Work'], available: true },
  { id: 'top-unavailable', name: 'Unavailable top', category: 'top', color: 'Cream', occasions: ['Work'], available: false },
];
const profile = {
  answers: {
    q1: { styles: ['minimalist'] },
    q2: { fits: ['regular'] },
    q3: { colors: ['neutrals'] },
    q4: { priorities: ['comfort', 'style', 'weather'] },
    q9: { adventurousness: 'balanced' },
  },
};

check(PRIORITY_WEIGHTS[0] > PRIORITY_WEIGHTS[1] && PRIORITY_WEIGHTS[1] > PRIORITY_WEIGHTS[2], 'ranked priority weights strictly decrease: 6, 3, 1');
const matchingItems = [
  metadataWardrobe.find((item) => item.id === 'top-neutral'),
  metadataWardrobe.find((item) => item.id === 'bottom-neutral'),
  metadataWardrobe.find((item) => item.id === 'shoes-neutral'),
];
const scored = scorePreferenceFactors(matchingItems, profile, 'cold');
check(scored.score === 100, 'a fully matching combination earns a fully supported 100 score');
check(scored.factors.find((factor) => factor.id === 'comfort').weight === 6, 'first-ranked comfort receives the greatest weight');
check(scored.factors.find((factor) => factor.id === 'style').weight === 3, 'second-ranked style receives the middle weight');
check(scored.factors.find((factor) => factor.id === 'weather').weight === 1, 'third-ranked weather receives the lowest weight');
const reorderedScore = scorePreferenceFactors(matchingItems, {
  answers: { ...profile.answers, q4: { priorities: ['weather', 'comfort', 'style'] } },
}, 'hot');
check(
  reorderedScore.factors.find((factor) => factor.id === 'weather').weight === 6 &&
    reorderedScore.factors.find((factor) => factor.id === 'comfort').weight === 3,
  'changing the saved priority order changes the applied factor weights',
);
const goalScored = scorePreferenceFactors(
  matchingItems.map((item) => ({ ...item, styleTags: ['formal'] })),
  {
    answers: {
      q8: { formality: ['formal'] },
      q10: { challenges: ['maximizing-wardrobe', 'trying-new-styles'], primaryGoal: 'discover-combinations' },
    },
  },
);
check(goalScored.factors.some((factor) => factor.id === 'formality' && factor.ratio === 1), 'saved formality preference scores against explicit garment style tags');
check(goalScored.factors.some((factor) => factor.id === 'versatility'), 'wardrobe-maximization goals add a supported versatility factor');
check(goalScored.factors.some((factor) => factor.id === 'discovery'), 'combination-discovery goals add a metadata-backed variety factor');

const priorityCompetingWardrobe = [
  { id: 'top-fit-first', name: 'Fitted top', category: 'top', fit: 'Regular', styleTags: ['streetwear'], occasions: ['Work'] },
  { id: 'top-style-first', name: 'Style top', category: 'top', fit: 'Oversized', styleTags: ['minimalist'], occasions: ['Work'] },
  { id: 'bottom-neutral', name: 'Bottom', category: 'bottom', occasions: ['Work'] },
  { id: 'shoes-neutral', name: 'Shoes', category: 'shoes', occasions: ['Work'] },
];
const comfortFirst = generateRecommendations('Work', priorityCompetingWardrobe, {
  answers: {
    q1: { styles: ['minimalist'] },
    q2: { fits: ['regular'] },
    q4: { priorities: ['comfort', 'style', 'weather'] },
  },
});
const styleFirst = generateRecommendations('Work', priorityCompetingWardrobe, {
  answers: {
    q1: { styles: ['minimalist'] },
    q2: { fits: ['regular'] },
    q4: { priorities: ['style', 'comfort', 'weather'] },
  },
});
check(
  comfortFirst.recommendations[0].items.some((item) => item.id === 'top-fit-first') &&
    styleFirst.recommendations[0].items.some((item) => item.id === 'top-style-first'),
  'changing priority order changes which competing outfit ranks first',
);

const ranked = generateRecommendations('Work', metadataWardrobe, profile, {
  weatherCondition: 'cold',
});
check(ranked.recommendations.length === 3, 'up to three distinct outfits are ranked');
check(
  ranked.recommendations[0].items.every((item) => !item.id.includes('unavailable')),
  'unavailable clothing is excluded',
);
check(
  ranked.recommendations.every((outfit) =>
    outfit.items.every((item) => metadataWardrobe.some((source) => source.id === item.id)),
  ),
  'every generated outfit component is from the supplied wardrobe',
);
check(
  ranked.recommendations.every((outfit) =>
    new Set(outfit.items.map((item) => item.id)).size === outfit.items.length,
  ),
  'generated outfits never repeat an item ID',
);
check(
  ranked.recommendations[0].items.some((item) => item.id === 'top-neutral'),
  'personal style and weather metadata affect ranking',
);
check(ranked.recommendations[0].score === 100, 'the highest matching outfit displays its actual normalized score');
check(
  ranked.recommendations[0].reasons.length >= 2 &&
    ranked.recommendations[0].reasons.every((reason) => reason.length > 0),
  'recommendations carry evidence-based reasons',
);

const rerolled = generateRecommendations('Work', metadataWardrobe, profile, {
  weatherCondition: 'cold',
  previousSignatures: ranked.signatures,
});
check(
  rerolled.recommendations.every((outfit) => !ranked.signatures.includes(outfit.signature)),
  'Try Another 3 excludes every previously shown combination when alternatives exist',
);
check(rerolled.recommendations.length > 0, 'reroll returns valid alternatives when available');

const noScore = generateRecommendations('Work', WARDROBE);
check(
  noScore.recommendations.every((outfit) => outfit.score === null),
  'no match percentages are shown without supporting preference metadata',
);

const partialWardrobe = metadataWardrobe.filter((item) => item.category !== 'shoes');
const partial = generateRecommendations('Work', partialWardrobe, profile);
check(partial.recommendations.length > 0, 'available garments can form a partial recommendation');
check(
  partial.recommendations.every((outfit) => !outfit.complete && outfit.items.length > 0),
  'partial outfits contain actual available items and are labeled incomplete',
);
check(
  partial.missingCategories.some((category) => category.id === 'shoes'),
  'partial recommendation identifies missing essential categories',
);
check(
  partial.recommendations.every((outfit) => outfit.items.every((item) => item.category !== 'shoes')),
  'partial recommendation never fabricates missing shoes',
);

const unavailableOnly = generateRecommendations(
  'Work',
  metadataWardrobe.filter((item) => item.category !== 'shoes' && item.category !== 'top'),
  profile,
  { fullWardrobe: metadataWardrobe },
);
check(
  unavailableOnly.unavailableCategories.some((category) => category.id === 'top'),
  'missing-category guidance distinguishes temporarily unavailable items',
);

const weatherPriorityProfile = {
  answers: { q4: { priorities: ['weather', 'comfort', 'style'] } },
};
const weatherMatch = generateRecommendations('Work', metadataWardrobe, weatherPriorityProfile, { weatherCondition: 'cold' });
const weatherMismatch = generateRecommendations('Work', metadataWardrobe, weatherPriorityProfile, { weatherCondition: 'hot' });
check(
  weatherMatch.recommendations[0].signature !== weatherMismatch.recommendations[0].signature,
  'manual weather context changes recommendation ranking when garment tags support it',
);

const familiarIdeas = generateRecommendations('Work', metadataWardrobe, null, { variety: 'familiar' });
const creativeIdeas = generateRecommendations('Work', metadataWardrobe, null, { variety: 'creative' });
const distinctMetadataCount = (outfit) =>
  new Set(outfit.items.flatMap((item) => [
    ...(item.styleTags || []),
    ...(item.colorFamily ? [item.colorFamily] : []),
  ])).size;
check(
  distinctMetadataCount(creativeIdeas.recommendations[0]) >=
    distinctMetadataCount(familiarIdeas.recommendations[0]),
  'Creative variety favors combinations with varied explicit style/color metadata',
);

console.log(
  `Passed ${checks} legacy recommendation checks and ${personalizedChecks} personalized recommendation checks.`,
);