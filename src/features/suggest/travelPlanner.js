const { OCCASIONS } = require('./occasions');
const { generateRecommendations } = require('./outfitRecommendations');
function planTravel(days, wardrobe, profile = null, options = {}) {
  if (!Array.isArray(days) || days.length < 1 || days.length > 5) throw new Error('Plan between one and five days.');
  if (days.some((day) => !day || !OCCASIONS.includes(day.occasion) || !['', 'cold', 'mild', 'hot', 'rainy'].includes(day.weather || ''))) throw new Error('Choose valid occasions and weather for each day.');
  const choices = days.map((day) => generateRecommendations(day.occasion, wardrobe, profile, { ...options, weatherCondition: day.weather || '' }).recommendations.filter((look) => look.complete));
  const missingDays = choices.flatMap((looks, index) => looks.length ? [] : [index + 1]);
  if (missingDays.length) return { outfits: [], items: [], missingDays };
  let best = null;
  function visit(index, looks) {
    if (index < choices.length) { for (const look of choices[index]) visit(index + 1, [...looks, look]); return; }
    const items = new Map();
    looks.forEach((look, dayIndex) => look.items.forEach((item) => {
      if (!items.has(item.id)) items.set(item.id, { ...item, days: [] });
      items.get(item.id).days.push(dayIndex + 1);
    }));
    const rankSum = looks.reduce((sum, look) => sum + look.rank, 0);
    const signature = looks.map((look) => look.signature).join(';');
    if (!best || items.size < best.items.length || (items.size === best.items.length && (rankSum < best.rankSum || (rankSum === best.rankSum && signature < best.signature)))) {
      best = { outfits: looks, items: [...items.values()], missingDays: [], rankSum, signature };
    }
  }
  visit(0, []);
  return best;
}
module.exports = { planTravel };
