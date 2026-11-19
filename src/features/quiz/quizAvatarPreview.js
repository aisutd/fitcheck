const CHOICES = {
  'light-layers': { label: 'Light layers', sleeves: 'long', bottoms: 'long', layer: false },
  'warm-layers': { label: 'Warm layers', sleeves: 'long', bottoms: 'long', layer: true },
  'coat-and-boots': { label: 'Coat and boots', sleeves: 'long', bottoms: 'long', layer: true },
  'shorts-light-top': { label: 'Shorts and a light top', sleeves: 'short', bottoms: 'short', layer: false },
  'light-and-breezy': { label: 'Light and breezy', sleeves: 'short', bottoms: 'short', layer: false },
  'shorts-and-tee': { label: 'Shorts and tee', sleeves: 'short', bottoms: 'short', layer: false },
  'light-coverage': { label: 'Light coverage', sleeves: 'long', bottoms: 'long', layer: false },
  'more-coverage': { label: 'More coverage', sleeves: 'long', bottoms: 'long', layer: false },
  'waterproof-layers': { label: 'Protective outer layer', sleeves: 'long', bottoms: 'long', layer: true },
  'umbrella-and-everyday': { label: 'Everyday clothing', sleeves: 'short', bottoms: 'long', layer: false },
  'minimal-extra': { label: 'Minimal extra protection', sleeves: 'short', bottoms: 'long', layer: false },
};
/** Return an illustration of the most recent outfit choice, without changing saved appearance. */
function quizAvatarPreview(answers, questionId, previewId = '') {
  const groups = { q5: 'coldOutfits', q6: 'hotOutfits', q7: 'rainOutfits' };
  const choices = answers?.[questionId]?.[groups[questionId]];
  const last = Array.isArray(choices) ? choices[choices.length - 1] : '';
  return CHOICES[previewId] || CHOICES[last] || { label: 'Choose an outfit idea to preview', sleeves: 'short', bottoms: 'long', layer: false };
}
module.exports = { quizAvatarPreview };
