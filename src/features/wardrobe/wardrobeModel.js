const WARDROBE_SCHEMA_VERSION = 1;
const RECOVERY_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const WARDROBE_CATEGORIES = ['top', 'bottom', 'shoes', 'layer', 'accessory'];
const OCCASIONS = ['Work', 'Date Night', 'Casual', 'Formal', 'Gym'];

function createEmptyWardrobeState() {
  return {
    schemaVersion: WARDROBE_SCHEMA_VERSION,
    mode: 'personal',
    personalItems: [],
    recentlyDeleted: [],
    demoAvailability: {},
  };
}

function isWardrobeItem(item) {
  return Boolean(
    item &&
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    WARDROBE_CATEGORIES.includes(item.category) &&
    typeof item.color === 'string' &&
    typeof item.available === 'boolean' &&
    Array.isArray(item.occasions) &&
    item.occasions.every((occasion) => OCCASIONS.includes(occasion)) &&
    (item.weatherTags === undefined ||
      (Array.isArray(item.weatherTags) &&
        item.weatherTags.every((tag) => ['cold', 'mild', 'hot', 'rainy'].includes(tag)))),
  );
}

function isWardrobeState(state) {
  return Boolean(
    state &&
    state.schemaVersion === WARDROBE_SCHEMA_VERSION &&
    ['personal', 'demo'].includes(state.mode) &&
    Array.isArray(state.personalItems) &&
    state.personalItems.every(isWardrobeItem) &&
    Array.isArray(state.recentlyDeleted) &&
    state.recentlyDeleted.every(
      (item) =>
        isWardrobeItem(item) &&
        typeof item.deletedAt === 'string' &&
        Number.isFinite(Date.parse(item.deletedAt)),
    ) &&
    state.demoAvailability &&
    typeof state.demoAvailability === 'object' &&
    !Array.isArray(state.demoAvailability) &&
    Object.values(state.demoAvailability).every((available) => typeof available === 'boolean'),
  );
}

function addPersonalItem(state, item) {
  if (!isWardrobeItem(item) || state.personalItems.some((existing) => existing.id === item.id)) {
    throw new Error('A new wardrobe item needs valid details and a unique ID.');
  }
  return { ...state, personalItems: [item, ...state.personalItems] };
}

function updatePersonalItem(state, item) {
  if (!isWardrobeItem(item) || !state.personalItems.some((existing) => existing.id === item.id)) {
    throw new Error('The wardrobe item could not be updated because it is missing or invalid.');
  }
  return {
    ...state,
    personalItems: state.personalItems.map((existing) =>
      existing.id === item.id ? item : existing,
    ),
  };
}

function moveToRecentlyDeleted(state, itemId, deletedAt = new Date().toISOString()) {
  const item = state.personalItems.find((entry) => entry.id === itemId);
  if (!item) throw new Error('The clothing item no longer exists in the active wardrobe.');
  return {
    ...state,
    personalItems: state.personalItems.filter((entry) => entry.id !== itemId),
    recentlyDeleted: [{ ...item, deletedAt }, ...state.recentlyDeleted],
  };
}

function restoreDeletedItem(state, itemId) {
  const item = state.recentlyDeleted.find((entry) => entry.id === itemId);
  if (!item) throw new Error('The recently deleted clothing item could not be found.');
  if (state.personalItems.some((entry) => entry.id === itemId)) {
    throw new Error('An item with this ID is already in the active wardrobe.');
  }
  const { deletedAt, ...restoredItem } = item;
  return {
    ...state,
    personalItems: [restoredItem, ...state.personalItems],
    recentlyDeleted: state.recentlyDeleted.filter((entry) => entry.id !== itemId),
  };
}

function permanentlyDeleteItem(state, itemId) {
  return {
    ...state,
    recentlyDeleted: state.recentlyDeleted.filter((entry) => entry.id !== itemId),
  };
}

function pruneExpiredItems(state, now = Date.now()) {
  const expired = [];
  const recentlyDeleted = state.recentlyDeleted.filter((item) => {
    const deletedAt = Date.parse(item.deletedAt);
    if (Number.isFinite(deletedAt) && now - deletedAt >= RECOVERY_PERIOD_MS) {
      expired.push(item);
      return false;
    }
    return true;
  });
  return {
    state: expired.length ? { ...state, recentlyDeleted } : state,
    expired,
  };
}

function setWardrobeMode(state, mode) {
  if (!['personal', 'demo'].includes(mode)) {
    throw new Error('Wardrobe mode must be Personal or Demo.');
  }
  return { ...state, mode };
}

function setItemAvailability(state, mode, itemId, available) {
  if (typeof available !== 'boolean') {
    throw new Error('Clothing availability must be Available or Unavailable.');
  }
  if (mode === 'personal') {
    const found = state.personalItems.some((item) => item.id === itemId);
    if (!found) throw new Error('The personal clothing item could not be found.');
    return {
      ...state,
      personalItems: state.personalItems.map((item) =>
        item.id === itemId ? { ...item, available } : item,
      ),
    };
  }
  if (mode === 'demo') {
    return {
      ...state,
      demoAvailability: { ...state.demoAvailability, [itemId]: available },
    };
  }
  throw new Error('Wardrobe mode must be Personal or Demo.');
}

function getActiveWardrobeItems(state, demoItems) {
  if (state.mode === 'demo') {
    return demoItems
      .filter((item) => state.demoAvailability[item.id] !== false)
      .map((item) => ({ ...item, available: true }));
  }
  return state.personalItems.filter((item) => item.available);
}

function filterWardrobeItems(items, filters = {}) {
  const search = (filters.search || '').trim().toLowerCase();
  const filtered = items.filter((item) => {
    const searchable = [
      item.name,
      item.category,
      item.color,
      item.colorFamily,
      item.clothingType,
      item.fit,
      item.size,
      item.weatherNotes,
      ...(item.styleTags || []),
      ...(item.seasons || []),
      ...(item.occasions || []),
    ].join(' ').toLowerCase();
    return (
      (!search || searchable.includes(search)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.colorFamily || item.colorFamily === filters.colorFamily) &&
      (!filters.fit || item.fit === filters.fit) &&
      (!filters.clothingType || item.clothingType === filters.clothingType) &&
      (filters.availability === null ||
        filters.availability === undefined ||
        item.available === filters.availability)
    );
  });

  return filtered.sort((left, right) => {
    if (filters.sort === 'recent') {
      return (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0);
    }
    return left.name.localeCompare(right.name);
  });
}

module.exports = {
  OCCASIONS,
  RECOVERY_PERIOD_MS,
  WARDROBE_CATEGORIES,
  WARDROBE_SCHEMA_VERSION,
  addPersonalItem,
  createEmptyWardrobeState,
  filterWardrobeItems,
  getActiveWardrobeItems,
  isWardrobeItem,
  isWardrobeState,
  moveToRecentlyDeleted,
  permanentlyDeleteItem,
  pruneExpiredItems,
  restoreDeletedItem,
  setItemAvailability,
  setWardrobeMode,
  updatePersonalItem,
};
