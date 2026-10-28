import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { matchesTimesWorn, getClothingFits, getItemLabels } from './constants';
import { isLegacyImageUri, recoverLegacyImage } from './photoService';

// Owns persistence (AsyncStorage, keyed by `storageKey` so Closet and
// Wishlist each get their own independent list), CRUD, and the filter/
// sort/search state for one tab's list of items. Instantiated once per
// tab in App.js (`useItemList('@fitcheck/clothes')` /
// `useItemList('@fitcheck/wishlist')`) so each tab's data and filters stay
// fully independent while sharing identical behavior.
export function useItemList(storageKey) {
const [items, setItems] = useState([]);
// Becomes true once the saved list has been read from AsyncStorage, so
// the save-effect below doesn't immediately overwrite it with the
// empty initial state before the load even finishes.
const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
const loadItems = async () => {
try {
const saved = await AsyncStorage.getItem(storageKey);
if (saved) {
// Migrate the retired Sweaters category for both Closet and Wishlist.
const loaded = JSON.parse(saved).map((item) => {
const category = ({ Sweaters: 'Tops', Hoodies: 'Outerwear', 'Hoodies/Jackets': 'Outerwear' })[item.category] || item.category;
const inferredType = /\b(jeans|pants)\b/i.exec(item.name || '')?.[1];
const itemType = item.item || item.itemType || (category === 'Bottoms' && inferredType
    ? inferredType[0].toUpperCase() + inferredType.slice(1).toLowerCase() : '');
return {
...item, category, itemType, item: itemType.toLowerCase(),
fit: item.fit || (getClothingFits(category).includes(item.design) ? item.design : ''),
design: ['Fitted', 'Relaxed', 'Oversized', 'Tailored'].includes(item.design) ? 'Other' : item.design,
// Preserve existing design and unrelated saved properties while migrating fit.
};
});
setItems(loaded);

// One-time self-healing pass: re-upload any item still
// pointing at a dead blob:/data: reference to
// photo-service and persist the resulting URL.
const needsRecovery = loaded.some((item) => isLegacyImageUri(item.image));
if (needsRecovery) {
const recovered = await Promise.all(
loaded.map(async (item) => {
if (!isLegacyImageUri(item.image)) return item;
const photoUrl = await recoverLegacyImage(item);
return { ...item, image: photoUrl };
})
);
setItems(recovered);
await AsyncStorage.setItem(storageKey, JSON.stringify(recovered));
}
}
} catch (error) {
console.warn('Failed to load saved items:', error);
} finally {
setIsLoaded(true);
}
};
loadItems();
}, [storageKey]);

// Persist the list to AsyncStorage every time it changes (add, delete,
// image update, etc.) so items survive a browser refresh / app restart.
useEffect(() => {
if (!isLoaded) return;
AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch((error) => {
console.warn('Failed to save items:', error);
});
}, [items, isLoaded, storageKey]);

const [selectedClothes, setSelectedClothes] = useState(null);

// URLs that failed to load (e.g. photo-service isn't running) so every
// <Image> can fall back to its placeholder text instead of a broken-
// image icon. Keyed by URL rather than item id so a URL that starts
// working again (service restarted) just needs a fresh attempt.
const [failedImageUrls, setFailedImageUrls] = useState(() => new Set());
const markImageFailed = (uri) => {
setFailedImageUrls((previous) => new Set(previous).add(uri));
};

const [selectedCategory, setSelectedCategory] = useState('All');
const [selectedColor, setSelectedColor] = useState('All');
const [selectedDesign, setSelectedDesign] = useState('All');
const [selectedLaundryStatus, setSelectedLaundryStatus] = useState('All');
const [selectedFit, setSelectedFit] = useState('All');
const [selectedMaterial, setSelectedMaterial] = useState('All');
const [selectedBrand, setSelectedBrand] = useState('All');
const [selectedTimesWorn, setSelectedTimesWorn] = useState('All');
const [onlyFavorites, setOnlyFavorites] = useState(false);

const [sortOrder, setSortOrder] = useState('newest');
const [searchText, setSearchText] = useState('');

//adding a new item
const addItem = (fields) => {
const { name, brand, category, color, design, material, itemType = '', fit = '', image, timesWorn = '0', laundryStatus = 'Clean' } = fields;

if (!name.trim() || !category || !color || !design || !material) {
Alert.alert('Missing information', 'Please enter a name, select a category, color, design, and material.');
return false;
}

const count = Number(timesWorn);
if (!Number.isInteger(count) || count < 0) {
Alert.alert('Invalid Times Worn', 'Enter a whole number that is 0 or greater.');
return false;
}

const newItem = {
id: Date.now().toString() + Math.random().toString(),
// Used for Newest/Oldest sorting - items saved before this field
// existed are treated as oldest (see filteringItems below).
createdAt: Date.now(),
name: name.trim(),
brand: brand.trim(),
category: category.trim(),
color: color.trim(),
design: design.trim(),
material: material.trim(),
itemType: getItemLabels(category).includes(itemType.toLowerCase()) ? itemType.toLowerCase() : '',
item: getItemLabels(category).includes(itemType.toLowerCase()) ? itemType.toLowerCase() : '',
fit: getClothingFits(category).includes(fit) ? fit : '',
timesWorn: count,
laundryStatus: laundryStatus,
image: image,
};

setItems((previousItems) => [...previousItems, newItem]);
return true;
};

// Inserts a fully-formed item object directly (skipping addItem's
// validation/trim logic) - used to move an already-complete item from
// another list (e.g. Wishlist -> Closet) with a fresh id/createdAt.
const addItemObject = (fields) => {
const newItem = {
...fields,
id: Date.now().toString() + Math.random().toString(),
createdAt: Date.now(),
};
setItems((previousItems) => [...previousItems, newItem]);
};

// Removes one item, used by the Detail modal's delete-confirmation
// flow. Doesn't touch photo-service - multiple items can link to the
// same photo (duplicated across items), so a photo is never deleted
// just because one item referencing it was deleted.
const deleteItem = (id) => {
setItems((previousItems) => previousItems.filter((item) => item.id !== id));
setSelectedClothes((previous) => (previous && previous.id === id ? null : previous));
};

// Bulk-sets laundryStatus on multiple items at once, used by Closet's
// multi-select "Mark Clean"/"Mark Dirty" bulk actions.
const setLaundryStatusForItems = (ids, status) => {
const idSet = new Set(ids);
setItems((previousItems) =>
previousItems.map((item) =>
idSet.has(item.id) ? { ...item, laundryStatus: status } : item
)
);
setSelectedClothes((previous) =>
previous && idSet.has(previous.id) ? { ...previous, laundryStatus: status } : previous
);
};

// Bulk version of deleteItem, used by multi-select's "Delete" action
// and by "Move to Closet" (removing the moved items from Wishlist).
// Also doesn't touch photo-service - see deleteItem above.
const deleteItems = (ids) => {
const idSet = new Set(ids);
setItems((previousItems) => previousItems.filter((item) => !idSet.has(item.id)));
setSelectedClothes((previous) => (previous && idSet.has(previous.id) ? null : previous));
};

// Updates the photo on an already-saved item (used from the Detail
// modal). Keeps `items` and `selectedClothes` in sync so the Detail
// modal shows the new photo immediately without needing to close/
// reopen it. Doesn't touch photo-service - see deleteItem above, the
// old photo may still be in use by another item.
const updateItemImage = (id, uri) => {
setItems((previousItems) =>
previousItems.map((item) => (item.id === id ? { ...item, image: uri } : item))
);
setSelectedClothes((previous) =>
previous && previous.id === id ? { ...previous, image: uri } : previous
);
};

// Toggles an item's favorite heart (Detail modal), independent of
// "Save Changes" - takes effect immediately.
const toggleFavorite = (id) => {
setItems((previousItems) =>
previousItems.map((item) =>
item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
)
);
setSelectedClothes((previous) =>
previous && previous.id === id ? { ...previous, isFavorite: !previous.isFavorite } : previous
);
};

// Writes edited fields from the Detail modal back onto the saved item
// in one batch (rather than per-field) so an item is never left
// half-updated.
const saveDetailChanges = (id, fields) => {
const { name, category, color, design, material, itemType = '', fit = '', laundryStatus } = fields;
const requiresLaundryStatus = laundryStatus !== undefined;
if (!name.trim() || !category || !color || !design || !material || (requiresLaundryStatus && !laundryStatus)) {
Alert.alert('Missing information', 'Name, category, color, design, and material cannot be empty.');
return false;
}
const updatedFields = {
name: name.trim(),
category,
color,
design,
material,
itemType: getItemLabels(category).includes(itemType.toLowerCase()) ? itemType.toLowerCase() : '',
item: getItemLabels(category).includes(itemType.toLowerCase()) ? itemType.toLowerCase() : '',
fit: getClothingFits(category).includes(fit) ? fit : '',
};
if (requiresLaundryStatus) updatedFields.laundryStatus = laundryStatus;

setItems((previousItems) =>
previousItems.map((item) =>
item.id === id ? { ...item, ...updatedFields } : item
)
);
setSelectedClothes(null);
return true;
};

//filtering items
const filteringItems = () => {
return items.filter((item) => {
const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
const matchesColor = selectedColor === 'All' || item.color === selectedColor;
const matchesDesign = selectedDesign === 'All' || item.design === selectedDesign;
const matchesMaterial = selectedMaterial === 'All' || item.material === selectedMaterial;
const matchesBrand = selectedBrand === 'All' || item.brand === selectedBrand;
const matchesLaundry = selectedLaundryStatus === 'All' || item.laundryStatus === selectedLaundryStatus;
const matchesWorn = matchesTimesWorn(item.timesWorn, selectedTimesWorn);
const matchesSearch = !searchText.trim()
|| item.name.toLowerCase().includes(searchText.trim().toLowerCase())
|| item.brand.toLowerCase().includes(searchText.trim().toLowerCase());
const matchesFavorite = !onlyFavorites || item.isFavorite;

return (selectedFit === 'All' || item.fit === selectedFit) && matchesCategory && matchesColor && matchesDesign && matchesMaterial && matchesBrand && matchesLaundry && matchesWorn && matchesSearch && matchesFavorite;
}).sort((a, b) => {
if (sortOrder === 'favorites') {
const favoriteDiff = (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
if (favoriteDiff !== 0) return favoriteDiff;
return (b.createdAt || 0) - (a.createdAt || 0);
}
return sortOrder === 'newest' ? (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0);
});
};

const resetFilters = () => {
setSelectedCategory('All');
setSelectedColor('All');
setSelectedDesign('All');
setSelectedMaterial('All');
setSelectedFit('All');
setSelectedTimesWorn('All');
setSelectedLaundryStatus('All');
};

return {
items,
isLoaded,
selectedClothes,
setSelectedClothes,
failedImageUrls,
markImageFailed,

selectedCategory, setSelectedCategory,
selectedColor, setSelectedColor,
selectedDesign, setSelectedDesign,
selectedLaundryStatus, setSelectedLaundryStatus,
selectedMaterial, setSelectedMaterial,
selectedFit, setSelectedFit,
selectedBrand, setSelectedBrand,
selectedTimesWorn, setSelectedTimesWorn,
onlyFavorites, setOnlyFavorites,
sortOrder, setSortOrder,
searchText, setSearchText,

filteringItems,
resetFilters,

addItem,
addItemObject,
deleteItem,
deleteItems,
setLaundryStatusForItems,
updateItemImage,
toggleFavorite,
saveDetailChanges,
};
}