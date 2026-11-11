const CATEGORY_MAP = { Tops: 'top', Bottoms: 'bottom', Shoes: 'shoes', Outerwear: 'layer', Dresses: 'onepiece', Suits: 'onepiece' };
const FIT_MAP = { Fitted: 'Slim/Fitted', Slim: 'Slim/Fitted', Regular: 'Regular', Relaxed: 'Relaxed', Oversized: 'Oversized' };
function applyRecognition(form, tags) {
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) throw new Error('Recognition returned invalid clothing details.');
  return { ...form, recognition: tags, category: CATEGORY_MAP[tags.category] || form.category,
    name: form.name || [tags.color, tags.item || tags.category].filter(Boolean).join(' '),
    clothingType: tags.item || form.clothingType, color: tags.color || form.color,
    material: tags.material || form.material || '', design: tags.design || form.design || '',
    recognizedFit: tags.fit || '', fit: FIT_MAP[tags.fit] || form.fit };
}
module.exports = { applyRecognition, CATEGORY_MAP };
