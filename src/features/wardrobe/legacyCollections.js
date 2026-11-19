import AsyncStorage from '@react-native-async-storage/async-storage';
import { toWardrobeItem } from '../collections/collectionAdapter';
/** Copy legacy records into the unified schema; original keys remain untouched. */
export async function importLegacyCollections(state) {
 const [closet, wishlist] = await Promise.all([AsyncStorage.getItem('@fitcheck/clothes'), AsyncStorage.getItem('@fitcheck/wishlist')]);
 function read(raw) {
  if (!raw) return [];
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error('Legacy clothing data is invalid. Original data has been preserved.');
  return items.map(toWardrobeItem);
 }
 return { ...state, personalItems: read(closet), wishlistItems: read(wishlist) };
}
