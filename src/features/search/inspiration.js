// Original editorial briefs based on linked public interviews/collaborations.
const INSPIRATIONS = [
 { id: 'denim', title: 'Vintage denim', creator: 'Emma Chamberlain', brief: 'Relaxed denim, a cozy knit and comfortable shoes. Mix vintage texture with simple everyday pieces.', terms: ['denim', 'jeans', 'knit', 'sweater', 'sneakers'], source: 'https://www.levi.com/US/en_US/levis-x-emma-chamberlain/c/levi_emma_chamberlain_womens_clothing_us' },
 { id: 'expression', title: 'Expressive tailoring', creator: 'Wisdom Kaye', brief: 'Build around tailored trousers and a statement layer. Experiment with proportion, texture and one confident color.', terms: ['tailored', 'trousers', 'blazer', 'statement', 'layer'], source: 'https://www.teenvogue.com/story/meet-wisdom-kaye-tiktoker-turned-img-model' },
 { id: 'ease', title: 'Relaxed essentials', creator: 'Matilda Djerf', brief: 'Loose trousers, a simple tee and a soft layer. Choose comfortable pieces you enjoy wearing repeatedly.', terms: ['relaxed', 'trousers', 'tee', 'cotton', 'soft'], source: 'https://www.ootd.com/editorial/style-q-a-with-matilda-djerf' },
];
function matchInspiration(items, { query = '', occasion = '', inspiration = null } = {}) {
 const words = inspiration?.terms || query.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2 && !['the','and','for','with','outfit','look'].includes(word));
 return items.filter(item => item.available && (!occasion || item.occasions?.includes(occasion))).map(item => {
  const text = [item.name, item.category, item.color, item.clothingType, ...(item.styleTags || []), ...(item.occasions || [])].join(' ').toLowerCase();
  return { item, score: words.filter(word => text.includes(word)).length };
 }).filter(({ score }) => !words.length || score > 0).sort((a,b) => b.score - a.score).map(({item}) => item);
}
module.exports = { INSPIRATIONS, matchInspiration };
