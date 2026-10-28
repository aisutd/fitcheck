const { scorePersonalWeather } = require('../quiz/weatherPreferences');

const OCCASIONS = ['Work', 'Date Night', 'Casual', 'Formal', 'Gym'];
const makeItem = (id, name, category, color, colorHex, occasions) => ({
  id,
  name,
  category,
  color,
  colorHex,
  occasions,
});

const WARDROBE = [
  makeItem('top-white-poplin', 'White Poplin Shirt', 'top', 'White', '#F4F4EF', ['Work', 'Formal']),
  makeItem('top-blue-oxford', 'Blue Oxford Shirt', 'top', 'Sky blue', '#91B6CC', ['Work', 'Casual']),
  makeItem('top-black-knit', 'Black Knit Polo', 'top', 'Black', '#242927', ['Work', 'Date Night', 'Casual']),
  makeItem('top-satin-blouse', 'Satin Evening Blouse', 'top', 'Oxblood', '#783D49', ['Date Night', 'Formal']),
  makeItem('top-graphic-tee', 'Relaxed Graphic Tee', 'top', 'Soft white', '#E9E8E1', ['Casual']),
  makeItem('top-training-tee', 'Training Tee', 'top', 'Cobalt', '#426FC4', ['Gym']),
  makeItem('top-compression-tank', 'Compression Tank', 'top', 'Charcoal', '#424A48', ['Gym']),
  makeItem('top-ribbed-turtleneck', 'Ribbed Turtleneck', 'top', 'Ivory', '#E8E2D3', ['Work', 'Date Night', 'Formal']),
  makeItem('top-linen-shirt', 'Linen Camp Shirt', 'top', 'Sage', '#A8B7A2', ['Casual', 'Date Night']),
  makeItem('bottom-charcoal-trousers', 'Tailored Charcoal Trousers', 'bottom', 'Charcoal', '#454A47', ['Work', 'Formal']),
  makeItem('bottom-wide-leg-trouser', 'Wide-Leg Trousers', 'bottom', 'Stone', '#A9A79D', ['Work', 'Formal', 'Date Night']),
  makeItem('bottom-dark-denim', 'Straight Dark Denim', 'bottom', 'Indigo', '#34475D', ['Casual', 'Date Night']),
  makeItem('bottom-midi-skirt', 'Pleated Midi Skirt', 'bottom', 'Forest', '#40594A', ['Work', 'Formal', 'Date Night']),
  makeItem('bottom-tailored-shorts', 'Tailored Linen Shorts', 'bottom', 'Stone', '#B8AD98', ['Date Night', 'Casual']),
  makeItem('bottom-training-shorts', 'Training Shorts', 'bottom', 'Black', '#262C2A', ['Gym']),
  makeItem('bottom-performance-leggings', 'Performance Leggings', 'bottom', 'Deep plum', '#51424E', ['Gym']),
  makeItem('bottom-cotton-chinos', 'Cotton Chinos', 'bottom', 'Olive', '#777C50', ['Casual', 'Work']),
  makeItem('shoes-leather-loafers', 'Leather Loafers', 'shoes', 'Espresso', '#624333', ['Work', 'Formal']),
  makeItem('shoes-evening-heels', 'Evening Heels', 'shoes', 'Black', '#262626', ['Date Night', 'Formal']),
  makeItem('shoes-white-sneakers', 'Low-Top Sneakers', 'shoes', 'White', '#E9E9E3', ['Casual']),
  makeItem('shoes-running-trainers', 'Running Trainers', 'shoes', 'Coral', '#D8755D', ['Gym']),
  makeItem('shoes-ankle-boots', 'Leather Ankle Boots', 'shoes', 'Dark brown', '#493831', ['Work', 'Date Night', 'Casual']),
  makeItem('layer-olive-blazer', 'Olive Tailored Blazer', 'layer', 'Olive', '#66765A', ['Work', 'Formal']),
  makeItem('layer-leather-jacket', 'Leather Moto Jacket', 'layer', 'Black', '#292D2B', ['Date Night', 'Casual']),
  makeItem('layer-trench-coat', 'Lightweight Trench', 'layer', 'Stone', '#A39D8E', ['Work', 'Date Night', 'Formal']),
  makeItem('layer-track-jacket', 'Track Jacket', 'layer', 'Cobalt', '#426FC4', ['Gym', 'Casual']),
].map((item) => ({
  ...item,
  // Authored sample attributes, not model predictions or claims about real garments.
  ...({
    'top-black-knit': { warmth: 'Light', coverage: 'Moderate', fit: 'Regular', styleTags: ['classic', 'smart-casual'], colorFamily: 'Darks', weatherTags: ['mild', 'hot'] },
    'top-linen-shirt': { warmth: 'Light', coverage: 'Moderate', fit: 'Relaxed', styleTags: ['minimalist', 'smart-casual'], colorFamily: 'Earth Tones', weatherTags: ['hot', 'mild'] },
    'top-ribbed-turtleneck': { warmth: 'Warm', coverage: 'More', fit: 'Slim/Fitted', styleTags: ['classic', 'minimalist'], colorFamily: 'Neutrals', weatherTags: ['cold'] },
    'bottom-tailored-shorts': { warmth: 'Light', coverage: 'Minimal', fit: 'Relaxed', styleTags: ['minimalist', 'smart-casual'], colorFamily: 'Earth Tones', weatherTags: ['hot', 'mild'] },
    'bottom-charcoal-trousers': { warmth: 'Warm', coverage: 'More', fit: 'Regular', styleTags: ['classic', 'smart-casual'], colorFamily: 'Darks', weatherTags: ['cold', 'mild'] },
    'bottom-wide-leg-trouser': { warmth: 'Warm', coverage: 'More', fit: 'Relaxed', styleTags: ['minimalist'], colorFamily: 'Neutrals', weatherTags: ['cold', 'mild'] },
    'shoes-ankle-boots': { styleTags: ['classic'], colorFamily: 'Darks', weatherTags: ['cold', 'rainy'] },
    'layer-trench-coat': { warmth: 'Light', coverage: 'More', waterproof: true, styleTags: ['classic'], colorFamily: 'Neutrals', weatherTags: ['rainy', 'mild'] },
    'layer-leather-jacket': { warmth: 'Warm', coverage: 'More', styleTags: ['streetwear'], colorFamily: 'Darks', weatherTags: ['cold'] },
  }[item.id] || {}),
}));

function getSignature(items) {
  return items.map((item) => item.id).sort().join('|');
}

const PRIORITY_WEIGHTS = [6, 3, 1];
const REQUIRED_CATEGORIES = [
  { id: 'top', label: 'a top' },
  { id: 'bottom', label: 'a bottom' },
  { id: 'shoes', label: 'a pair of shoes' },
];
const CATEGORY_IDS = ['top', 'bottom', 'shoes', 'layer', 'accessory'];

function joinLabels(labels) {
  if (labels.length < 2) return labels[0] || '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function normalizedValue(value) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s/_-]+/g, '') : '';
}

function normalizedFit(value) {
  const normalized = normalizedValue(value);
  return normalized === 'slimfitted' ? 'slim' : normalized;
}

function getGroupAnswer(profile, questionId, groupId) {
  const value = profile?.answers?.[questionId]?.[groupId];
  return value == null ? null : value;
}

function scorePreferenceFactors(items, profile, weatherCondition) {
  const styles = getGroupAnswer(profile, 'q1', 'styles') || [];
  const fits = getGroupAnswer(profile, 'q2', 'fits') || [];
  const colors = getGroupAnswer(profile, 'q3', 'colors') || [];
  const rankedPriorities = getGroupAnswer(profile, 'q4', 'priorities') || [];
  const formality = getGroupAnswer(profile, 'q8', 'formality') || [];
  const challenges = getGroupAnswer(profile, 'q10', 'challenges') || [];
  const primaryGoal = getGroupAnswer(profile, 'q10', 'primaryGoal');

  const personalWeather = scorePersonalWeather(items, profile, weatherCondition);
  const factorDefinitions = [
    {
      id: 'comfort',
      label: 'Fit & comfort',
      priority: 'comfort',
      selected: fits,
      values: items.map((item) => item.fit),
    },
    {
      id: 'style',
      label: 'Style alignment',
      priority: 'style',
      selected: styles,
      values: items.flatMap((item) => Array.isArray(item.styleTags) ? item.styleTags : []),
    },
    {
      id: 'personality',
      label: 'Personal expression',
      priority: 'personality',
      selected: styles,
      values: items.flatMap((item) => Array.isArray(item.styleTags) ? item.styleTags : []),
    },
    {
      id: 'formality',
      label: 'Everyday formality',
      priority: null,
      selected: formality,
      values: items.flatMap((item) => Array.isArray(item.styleTags) ? item.styleTags : []),
    },
    {
      id: 'color',
      label: 'Color preference',
      priority: null,
      selected: colors,
      values: items.map((item) => item.colorFamily),
    },
    {
      id: 'weather',
      label: 'Weather match',
      priority: 'weather',
      selected: weatherCondition && !personalWeather ? [weatherCondition] : [],
      values: items.flatMap((item) => [
        ...(Array.isArray(item.weatherTags) ? item.weatherTags : []),
        ...(weatherCondition === 'rainy' && item.waterproof === true ? ['rainy'] : []),
      ]),
    },
  ];

  /** @type {{id: string, label: string, ratio: number, matched: number, evaluated: number, weight: number, weightedPoints: number, maxPoints: number, reason?: string}[]} */
  const factors = factorDefinitions.flatMap((definition) => {
    if (!definition.selected.length) return [];
    const actualValues = definition.values.filter((value) => typeof value === 'string' && value.trim());
    if (!actualValues.length) return [];
    const normalize = definition.id === 'comfort' ? normalizedFit : normalizedValue;
    const selected = new Set(definition.selected.map(normalize));
    const matched = actualValues.filter((value) => selected.has(normalize(value))).length;
    const ratio = matched / actualValues.length;
    const priorityIndex = definition.priority
      ? rankedPriorities.indexOf(definition.priority)
      : -1;
    const weight = priorityIndex >= 0
      ? PRIORITY_WEIGHTS[priorityIndex]
      : 1;
    return [{
      id: definition.id,
      label: definition.label,
      ratio,
      matched,
      evaluated: actualValues.length,
      weight,
      weightedPoints: ratio * weight,
      maxPoints: weight,
    }];
  });

  if (personalWeather) {
    const priorityIndex = rankedPriorities.indexOf('weather');
    const weight = priorityIndex >= 0 ? PRIORITY_WEIGHTS[priorityIndex] : 1;
    factors.push({
      id: 'weather', label: 'Personal weather preference', ...personalWeather,
      weight, weightedPoints: personalWeather.ratio * weight, maxPoints: weight,
    });
  }

  const versatilityPriorityIndex = rankedPriorities.indexOf('versatility');
  if (
    versatilityPriorityIndex >= 0 ||
    primaryGoal === 'maximize-use' ||
    challenges.includes('maximizing-wardrobe')
  ) {
    const occasionCounts = items
      .map((item) => Array.isArray(item.occasions) ? item.occasions.length : 0)
      .filter((count) => count > 0);
    if (occasionCounts.length) {
      const ratio = occasionCounts.reduce((total, count) => total + count / OCCASIONS.length, 0) /
        occasionCounts.length;
      const weight = versatilityPriorityIndex >= 0
        ? PRIORITY_WEIGHTS[versatilityPriorityIndex]
        : 1;
      factors.push({
        id: 'versatility',
        label: 'Wardrobe versatility',
        ratio,
        matched: Math.round(ratio * occasionCounts.length),
        evaluated: occasionCounts.length,
        weight,
        weightedPoints: ratio * weight,
        maxPoints: weight,
      });
    }
  }

  const conveniencePriorityIndex = rankedPriorities.indexOf('convenience');
  if (
    (conveniencePriorityIndex >= 0 ||
      primaryGoal === 'save-time' ||
      challenges.includes('deciding-quickly')) &&
    items.length
  ) {
    const weight = conveniencePriorityIndex >= 0
      ? PRIORITY_WEIGHTS[conveniencePriorityIndex]
      : 1;
    const ratio = Math.max(0, 1 - (items.length - REQUIRED_CATEGORIES.length) / 2);
    factors.push({
      id: 'convenience',
      label: 'Getting dressed simply',
      ratio,
      matched: ratio === 1 ? 1 : 0,
      evaluated: 1,
      weight,
      weightedPoints: ratio * weight,
      maxPoints: weight,
    });
  }

  if (
    primaryGoal === 'discover-combinations' ||
    challenges.includes('trying-new-styles')
  ) {
    const metadata = items.flatMap((item) => [
      ...(Array.isArray(item.styleTags) ? item.styleTags : []),
      ...(item.colorFamily ? [item.colorFamily] : []),
    ]).map(normalizedValue).filter(Boolean);
    if (metadata.length) {
      const ratio = Math.min(1, new Set(metadata).size / metadata.length);
      factors.push({
        id: 'discovery',
        label: 'New wardrobe combinations',
        ratio,
        matched: new Set(metadata).size,
        evaluated: metadata.length,
        weight: 1,
        weightedPoints: ratio,
        maxPoints: 1,
      });
    }
  }

  if (!factors.length) {
    return { score: null, factors: [], reasonCandidates: [] };
  }

  const totalWeight = factors.reduce((total, factor) => total + factor.maxPoints, 0);
  const score = Math.round(
    factors.reduce((total, factor) => total + factor.weightedPoints, 0) /
      totalWeight * 100,
  );
  const orderedFactors = [...factors].sort(
    (left, right) => right.weightedPoints - left.weightedPoints || left.id.localeCompare(right.id),
  );
  return {
    score,
    factors,
    reasonCandidates: orderedFactors
      .filter((factor) => factor.ratio > 0)
      .map((factor) => factor.reason || `${factor.label} aligns with ${factor.matched} of ${factor.evaluated} available wardrobe details.`),
  };
}

function getVarietyScore(items, variety, previousSignatures) {
  const signatures = new Set(previousSignatures);
  const signature = getSignature(items);
  const historyOverlap = items.reduce((score, item) => {
    const used = Array.from(signatures).some((previous) => previous.split('|').includes(item.id));
    return score + (used ? 1 : 0);
  }, 0);
  const metadata = items.flatMap((item) => [
    ...(Array.isArray(item.styleTags) ? item.styleTags : []),
    ...(item.colorFamily ? [item.colorFamily] : []),
  ]).map(normalizedValue).filter(Boolean);
  const diversity = new Set(metadata).size;

  if (variety === 'familiar') {
    return items.length + historyOverlap - Math.max(0, diversity - 1) * 0.15;
  }
  if (variety === 'creative') {
    return diversity + (signatures.has(signature) ? -100 : 0);
  }
  return 0;
}

function getOutfitSignature(outfit) {
  return getSignature(outfit.items);
}

function buildCandidate(items, occasion, profile, weatherCondition, variety, previousSignatures, complete) {
  const preference = scorePreferenceFactors(items, profile, weatherCondition);
  const reasons = [
    `${occasion} occasion match from the selected clothing records.`,
    ...preference.reasonCandidates,
  ].slice(0, 3);
  return {
    items,
    occasion,
    complete,
    score: preference.score,
    factors: preference.factors,
    reasons,
    varietyScore: getVarietyScore(items, variety, previousSignatures),
    signature: getSignature(items),
  };
}

function buildCandidates(occasion, wardrobe, profile, weatherCondition, variety, previousSignatures, options) {
  const seenIds = new Set();
  const matchingItems = [];
  for (const item of Array.isArray(wardrobe) ? wardrobe : []) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !item.id ||
      seenIds.has(item.id) ||
      item.available === false ||
      !CATEGORY_IDS.includes(item.category) ||
      !Array.isArray(item.occasions) ||
      !item.occasions.includes(occasion)
    ) {
      continue;
    }
    seenIds.add(item.id);
    matchingItems.push(item);
  }

  const byCategory = Object.fromEntries(
    CATEGORY_IDS.map((category) => [category, matchingItems.filter((item) => item.category === category)]),
  );
  const missingCategories = REQUIRED_CATEGORIES
    .filter(({ id }) => !byCategory[id].length)
    .map(({ id, label }) => ({ id, label }));
  const unavailableCategories = REQUIRED_CATEGORIES
    .filter(({ id }) => !byCategory[id].length)
    .filter(({ id }) =>
      (options.fullWardrobe || []).some(
        (item) => item.category === id && item.available === false && item.occasions?.includes(occasion),
      ),
    );
  const recentlyDeletedCategories = REQUIRED_CATEGORIES
    .filter(({ id }) => !byCategory[id].length)
    .filter(({ id }) =>
      (options.recentlyDeleted || []).some(
        (item) => item.category === id && item.occasions?.includes(occasion),
      ),
    );

  const hasMissing = missingCategories.length > 0;
  const tops = byCategory.top.length ? byCategory.top : [null];
  const bottoms = byCategory.bottom.length ? byCategory.bottom : [null];
  const shoes = byCategory.shoes.length ? byCategory.shoes : [null];
  const layers = [null, ...byCategory.layer];
  const accessories = [null, ...byCategory.accessory];
  const candidates = [];
  const signatures = new Set();

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        for (const layer of layers) {
          for (const accessory of accessories) {
            const items = [top, bottom, shoe, layer, accessory].filter(Boolean);
            if (!items.length || new Set(items.map((item) => item.id)).size !== items.length) continue;
            const signature = getSignature(items);
            if (signatures.has(signature)) continue;
            signatures.add(signature);
            candidates.push(buildCandidate(
              items,
              occasion,
              profile,
              weatherCondition,
              variety,
              previousSignatures,
              !hasMissing,
            ));
          }
        }
      }
    }
  }

  return {
    candidates,
    missingCategories,
    matchingItems,
    unavailableCategories,
    recentlyDeletedCategories,
  };
}

/**
 * @param {string} occasion
 * @param {Array<object>} wardrobe
 * @param {{answers?: any} | null} profile
 * @param {{variety?: string, previousSignatures?: string[], weatherCondition?: string, fullWardrobe?: object[], recentlyDeleted?: object[]}} options
 */
function generateRecommendations(
  occasion,
  wardrobe,
  profile = null,
  options = {},
) {
  const variety = ['familiar', 'balanced', 'creative'].includes(options.variety || '')
    ? options.variety
    : 'balanced';
  const previousSignatures = Array.isArray(options.previousSignatures)
    ? options.previousSignatures
    : [];
  const {
    candidates,
    missingCategories,
    matchingItems,
    unavailableCategories,
    recentlyDeletedCategories,
  } = buildCandidates(
    occasion,
    wardrobe,
    profile,
    options.weatherCondition || '',
    variety,
    previousSignatures,
    options,
  );
  const unseen = candidates.filter((candidate) => !previousSignatures.includes(candidate.signature));
  const pool = unseen.length ? unseen : candidates;
  pool.sort((left, right) => {
    if (left.score != null && right.score != null && left.score !== right.score) {
      return right.score - left.score;
    }
    if (left.score != null && right.score == null) return -1;
    if (left.score == null && right.score != null) return 1;
    // At equal scores, prefer results supported by more entered details.
    // This does not turn unknown attributes into mismatches or change the score.
    const leftEvidence = left.factors.reduce((total, factor) => total + factor.evaluated, 0);
    const rightEvidence = right.factors.reduce((total, factor) => total + factor.evaluated, 0);
    if (leftEvidence !== rightEvidence) return rightEvidence - leftEvidence;
    if (left.varietyScore !== right.varietyScore) return right.varietyScore - left.varietyScore;
    return left.signature.localeCompare(right.signature);
  });

  const recommendations = pool.slice(0, 3).map(({ varietyScore, ...candidate }, index) => ({
    ...candidate,
    rank: index + 1,
  }));
  const moreAvailable = unseen.length > recommendations.length;
  const message = recommendations.length === 0
    ? `No clothing in this wardrobe is tagged for ${occasion}. Add clothing and select its suitable occasions, or choose Demo Mode.`
    : missingCategories.length
      ? `These are partial ideas from your available wardrobe. Missing ${joinLabels(missingCategories.map((item) => item.label))} for ${occasion}.`
      : !unseen.length && previousSignatures.length
        ? 'You have seen every available combination for this occasion. Start over to see them again.'
        : '';

  return {
    recommendations,
    missingCategories,
    matchingItemCount: matchingItems.length,
    unavailableCategories,
    recentlyDeletedCategories,
    message,
    moreAvailable,
    signatures: recommendations.map(getOutfitSignature),
  };
}

function recommendOutfit(occasion, wardrobe = WARDROBE, previousOutfitIds = [], attempt = 0) {
  const seenIds = new Set();
  const matchingItems = [];

  for (const item of Array.isArray(wardrobe) ? wardrobe : []) {
    if (!item || typeof item.id !== 'string' || !item.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    if (
      ['top', 'bottom', 'shoes', 'layer'].includes(item.category) &&
      Array.isArray(item.occasions) &&
      item.occasions.includes(occasion)
    ) {
      matchingItems.push(item);
    }
  }

  const tops = matchingItems.filter((item) => item.category === 'top');
  const bottoms = matchingItems.filter((item) => item.category === 'bottom');
  const shoes = matchingItems.filter((item) => item.category === 'shoes');
  const layers = matchingItems.filter((item) => item.category === 'layer');
  const missingCategories = [];

  if (tops.length === 0) missingCategories.push('a top');
  if (bottoms.length === 0) missingCategories.push('a bottom');
  if (shoes.length === 0) missingCategories.push('a pair of shoes');

  if (missingCategories.length > 0) {
    return {
      items: [],
      message: `Your wardrobe needs ${joinLabels(missingCategories)} suitable for ${occasion} to build a complete outfit.`,
    };
  }

  const layerOptions = [...layers, null];
  const totalCombinations = tops.length * bottoms.length * shoes.length * layerOptions.length;
  const previousIds = Array.isArray(previousOutfitIds) ? previousOutfitIds : [];
  const previousSignature = getSignature(previousIds.map((id) => ({ id })));
  const start = Number.isFinite(attempt) ? Math.abs(Math.trunc(attempt)) % totalCombinations : 0;
  let firstOutfit = null;

  for (let offset = 0; offset < totalCombinations; offset += 1) {
    let combinationIndex = (start + offset) % totalCombinations;
    const layer = layerOptions[combinationIndex % layerOptions.length];
    combinationIndex = Math.floor(combinationIndex / layerOptions.length);
    const shoe = shoes[combinationIndex % shoes.length];
    combinationIndex = Math.floor(combinationIndex / shoes.length);
    const bottom = bottoms[combinationIndex % bottoms.length];
    const top = tops[Math.floor(combinationIndex / bottoms.length) % tops.length];
    const items = [top, bottom, shoe, layer].filter(Boolean);

    if (new Set(items.map((item) => item.id)).size !== items.length) continue;
    if (!firstOutfit) firstOutfit = items;
    if (previousIds.length === 0 || getSignature(items) !== previousSignature) {
      return { items, message: '' };
    }
  }

  return {
    items: firstOutfit || [],
    message: 'This is the only complete combination available for this occasion.',
  };
}

module.exports = {
  OCCASIONS,
  PRIORITY_WEIGHTS,
  WARDROBE,
  generateRecommendations,
  recommendOutfit,
  scorePreferenceFactors,
};