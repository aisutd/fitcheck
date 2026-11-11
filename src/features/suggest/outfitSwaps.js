const { scorePreferenceFactors } = require('./outfitRecommendations');

function getSwapChoices(wardrobe, occasion, category) {
  const seen = new Set();
  return (Array.isArray(wardrobe) ? wardrobe : []).filter((item) => {
    if (!item?.id || seen.has(item.id) || item.category !== category || item.available === false || !item.occasions?.includes(occasion)) return false;
    seen.add(item.id);
    return true;
  });
}

// Never mutate a generated recommendation or the wardrobe. Invalidated swaps fall back
// to the current generated piece, e.g. after a wardrobe item is deleted/unavailable.
function applyOutfitSwaps(base, replacements, wardrobe, profile, weatherCondition = '') {
  const items = base.items.map((item) =>
    getSwapChoices(wardrobe, base.occasion, item.category)
      .find((choice) => choice.id === replacements?.[item.category]) || item);
  const customized = items.some((item, index) => item.id !== base.items[index].id);
  if (!customized) return { ...base, customized: false, cardId: base.signature };
  const preference = scorePreferenceFactors(items, profile, weatherCondition);
  return {
    ...base,
    items,
    signature: items.map((item) => item.id).sort().join('|'),
    cardId: base.signature,
    customized: true,
    score: preference.score,
    factors: preference.factors,
    reasons: [`${base.occasion} occasion match from the selected clothing records.`, ...preference.reasonCandidates].slice(0, 3),
  };
}
module.exports = { getSwapChoices, applyOutfitSwaps };
