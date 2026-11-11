const TO_SOURCE = { top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes', layer: 'Outerwear', accessory: 'Accessories', onepiece: 'Dresses' };
const TO_APP = { Tops: 'top', Bottoms: 'bottom', Shoes: 'shoes', Outerwear: 'layer', Dresses: 'onepiece', Suits: 'onepiece', Accessories: 'accessory', Sweaters: 'top', Hoodies: 'layer', 'Hoodies/Jackets': 'layer' };
function toCollectionItem(item) {
 return { ...item, category: (TO_APP[item.sourceCategory] === item.category ? item.sourceCategory : '') || TO_SOURCE[item.category] || item.category, image: item.photoUri || item.image || null,
  brand: item.brand || '', design: item.design || '', material: item.material || '',
  item: item.item || item.clothingType || '', itemType: item.itemType || item.clothingType || '',
  timesWorn: item.timesWorn || 0, laundryStatus: item.laundryStatus || 'Clean',
  createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.parse(item.createdAt) || 0 };
}
function toWardrobeItem(item) {
 const category = TO_APP[item.category];
 if (!category) throw new Error(`Unsupported clothing category: ${item.category}`);
 return { ...item, sourceCategory: item.category, category, photoUri: item.image || null,
  clothingType: item.itemType || item.item || item.clothingType || '',
  color: item.color || '', available: item.available !== false, occasions: item.occasions || [],
  createdAt: typeof item.createdAt === 'number' ? new Date(item.createdAt).toISOString() : item.createdAt || new Date().toISOString() };
}
module.exports = { toCollectionItem, toWardrobeItem };
