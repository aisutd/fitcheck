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
];

function getSignature(items) {
  return items.map((item) => item.id).sort().join('|');
}

function joinLabels(labels) {
  if (labels.length < 2) return labels[0] || '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
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

module.exports = { OCCASIONS, WARDROBE, recommendOutfit };