const SHOP_CATEGORIES = { top: 'Top', bottom: 'Bottom', shoes: 'Shoes', layer: 'Layer', accessory: 'Accessory' };
const OCCASIONS = ['Work', 'Date Night', 'Casual', 'Formal', 'Gym'];
function validateSearch(input) {
  if (!input || !OCCASIONS.includes(input.occasion) || !Object.prototype.hasOwnProperty.call(SHOP_CATEGORIES, input.category)) {
    throw new Error('Choose a valid occasion and clothing category.');
  }
  const maxPrice = input.maxPrice === '' || input.maxPrice == null ? null : Number(input.maxPrice);
  if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0.01 || maxPrice > 10000)) {
    throw new Error('Enter a maximum price between $0.01 and $10,000.');
  }
  const style = typeof input.style === 'string' ? input.style.replace(/[^a-zA-Z -]/g, '').trim().slice(0, 40) : '';
  return { occasion: input.occasion, category: input.category, style, maxPrice };
}
function buildShoppingQuery(input) {
  const search = validateSearch(input);
  const nouns = { top: 'clothing top', bottom: 'pants skirt shorts', shoes: 'shoes', layer: 'jacket cardigan', accessory: 'fashion accessory' };
  return [search.style, search.occasion, nouns[search.category]].filter(Boolean).join(' ');
}
function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function normalizeProducts(results, maxPrice = null) {
  const seen = new Set();
  return (Array.isArray(results) ? results : []).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const url = safeHttps(item.product_link || item.link);
    const price = item.extracted_price;
    // US results only: omit unpriced, non-USD and unsafe entries rather than invent details.
    if (!url || typeof item.title !== 'string' || !item.title.trim() ||
        typeof price !== 'number' || !Number.isFinite(price) || price < 0 ||
        typeof item.price !== 'string' || !/^\$[\d,]+(?:\.\d{1,2})?$/.test(item.price.trim()) ||
        (maxPrice !== null && price > maxPrice) || seen.has(item.product_id || url)) return [];
    seen.add(item.product_id || url);
    return [{ id: String(item.product_id || url), title: item.title.slice(0, 200),
      retailer: typeof item.source === 'string' ? item.source.slice(0, 100) : 'Seller not listed',
      price, currency: 'USD', url, image: safeHttps(item.thumbnail) }];
  }).slice(0, 100);
}
module.exports = { SHOP_CATEGORIES, validateSearch, buildShoppingQuery, safeHttps, normalizeProducts };
