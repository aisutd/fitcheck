function carouselWindow(options, focusedId) {
  if (!options.length) return [];
  const found = options.findIndex((option) => option.id === focusedId);
  const index = found < 0 ? 0 : found;
  const offsets = options.length === 1 ? [0] : options.length === 2 ? [-1, 0] : [-1, 0, 1];
  return offsets.map((offset) => ({ option: options[(index + offset + options.length) % options.length], offset }));
}
function nextCarouselId(options, focusedId, direction) {
  if (!options.length) return '';
  const index = Math.max(0, options.findIndex((option) => option.id === focusedId));
  return options[(index + direction + options.length) % options.length].id;
}
const QUIZ_SHOPPING = {
  'light-layers': { category: 'layer', terms: 'lightweight overshirt' },
  'warm-layers': { category: 'layer', terms: 'warm knit cardigan' },
  'coat-and-boots': { category: 'layer', terms: 'winter coat' },
  'shorts-light-top': { category: 'bottom', terms: 'tailored shorts' },
  'light-and-breezy': { category: 'top', terms: 'lightweight linen shirt' },
  'shorts-and-tee': { category: 'top', terms: 'short sleeve cotton t shirt' },
  'light-coverage': { category: 'top', terms: 'lightweight long sleeve shirt' },
  'more-coverage': { category: 'bottom', terms: 'lightweight full length pants' },
  'waterproof-layers': { category: 'layer', terms: 'waterproof rain jacket' },
  'umbrella-and-everyday': { category: 'accessory', terms: 'compact rain umbrella' },
  'minimal-extra': { category: 'top', terms: 'casual everyday shirt' },
};
module.exports = { carouselWindow, nextCarouselId, QUIZ_SHOPPING };
