const CATEGORY_NAMES = { top: 'top', bottom: 'bottoms', layer: 'outerwear', onepiece: 'dress', shoes: 'shoes', accessory: 'accessory' };
function label(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim().toLowerCase().replace(/^slim\/fitted$/, 'fitted');
  return ['', 'not applicable', 'unknown', 'unclear', 'n/a'].includes(text) ? '' : text;
}

// Prefer the wardrobe fields the user reviewed; fill missing details from AI tags.
function buildGarmentDescription(item = {}) {
  const tags = item.recognition || {};
  const parts = [
    label(item.color) || label(tags.color),
    label(item.fit) || label(tags.fit),
    label(item.material) || label(tags.material),
    label(item.design) || label(tags.design),
    label(item.clothingType) || label(item.itemType) || label(item.item) || label(tags.item)
      || label(CATEGORY_NAMES[item.category]) || label(tags.category),
  ];
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 500).trim() || 'a clothing item';
}

module.exports = { buildGarmentDescription };
