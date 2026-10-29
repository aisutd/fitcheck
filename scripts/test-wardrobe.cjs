const assert = require('node:assert/strict');
const {
  OCCASIONS,
  RECOVERY_PERIOD_MS,
  addPersonalItem,
  createEmptyWardrobeState,
  filterWardrobeItems,
  getActiveWardrobeItems,
  isWardrobeState,
  moveToRecentlyDeleted,
  permanentlyDeleteItem,
  pruneExpiredItems,
  restoreDeletedItem,
  setItemAvailability,
  setWardrobeMode,
  updatePersonalItem,
} = require('../src/features/wardrobe/wardrobeModel');

let checks = 0;

function check(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}

function fixture(overrides = {}) {
  return {
    id: 'top-linen',
    name: 'Linen shirt',
    category: 'top',
    clothingType: 'Button-down',
    color: 'Sage',
    colorFamily: 'Earth Tones',
    fit: 'Relaxed',
    size: '',
    sizeSystem: '',
    styleTags: ['summer', 'workwear'],
    seasons: ['Summer'],
    weatherNotes: '',
    waterproof: false,
    occasions: ['Work', 'Casual'],
    available: true,
    photoUri: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

let state = createEmptyWardrobeState();
check(isWardrobeState(state), 'empty wardrobe state is valid');

state = addPersonalItem(state, fixture());
check(state.personalItems.length === 1, 'personal item can be added');
check(state.personalItems[0].id === 'top-linen', 'personal item ID is retained');
check(
  (() => {
    try {
      addPersonalItem(state, fixture());
      return false;
    } catch {
      return true;
    }
  })(),
  'duplicate personal IDs are rejected',
);

state = updatePersonalItem(state, fixture({ name: 'Updated linen shirt', fit: 'Regular' }));
check(state.personalItems[0].name === 'Updated linen shirt', 'personal item can be edited');
check(state.personalItems[0].fit === 'Regular', 'edits preserve updated metadata');

state = setItemAvailability(state, 'personal', 'top-linen', false);
check(!state.personalItems[0].available, 'personal availability can be changed');
check(
  filterWardrobeItems(state.personalItems, { availability: false }).length === 1,
  'availability filtering returns unavailable items',
);

const deletedAt = '2026-10-10T00:00:00.000Z';
state = moveToRecentlyDeleted(state, 'top-linen', deletedAt);
check(state.personalItems.length === 0, 'soft-deleted items leave the active wardrobe');
check(state.recentlyDeleted[0].deletedAt === deletedAt, 'soft delete stores its deletion date');
state = restoreDeletedItem(state, 'top-linen');
check(state.personalItems[0].id === 'top-linen', 'restoration preserves the original item ID');
check(state.personalItems[0].available === false, 'restoration preserves item availability');
check(!('deletedAt' in state.personalItems[0]), 'restored item no longer has a deletion marker');

state = moveToRecentlyDeleted(state, 'top-linen', deletedAt);
const now = Date.parse(deletedAt) + RECOVERY_PERIOD_MS;
const pruned = pruneExpiredItems(state, now);
check(pruned.expired.length === 1, 'items expire at the end of the 30-day recovery period');
check(pruned.state.recentlyDeleted.length === 0, 'expired items leave Recently Deleted');

state = createEmptyWardrobeState();
const demoOnly = setItemAvailability(state, 'demo', 'top-white-poplin', false);
check(
  demoOnly.personalItems.length === 0 &&
    demoOnly.demoAvailability['top-white-poplin'] === false,
  'demo availability is stored separately from Personal items',
);
check(
  setWardrobeMode(demoOnly, 'demo').mode === 'demo',
  'Demo Mode can be selected explicitly',
);
check(
  setWardrobeMode(demoOnly, 'personal').demoAvailability['top-white-poplin'] === false,
  'switching to Personal Mode preserves Demo availability',
);
const personalOnlyState = addPersonalItem(state, fixture());
check(
  getActiveWardrobeItems(personalOnlyState, [fixture({ id: 'demo-shirt' })])
    .map((item) => item.id).join(',') === 'top-linen',
  'Personal recommendations receive only active Personal item IDs',
);
check(
  getActiveWardrobeItems(setWardrobeMode(setItemAvailability(state, 'demo', 'demo-shirt', false), 'demo'), [
    fixture({ id: 'demo-shirt' }),
    fixture({ id: 'demo-pants', category: 'bottom' }),
  ]).map((item) => item.id).join(',') === 'demo-pants',
  'Demo recommendations receive only available Demo item IDs',
);

const items = [
  fixture({ id: 'a', name: 'Linen shirt', createdAt: '2026-10-01T00:00:00.000Z' }),
  fixture({ id: 'b', name: 'Blue cotton shirt', colorFamily: 'Neutrals', fit: 'Regular', styleTags: ['basic'], clothingType: 'T-shirt', createdAt: '2026-10-05T00:00:00.000Z' }),
];
check(
  filterWardrobeItems(items, { search: 'WORKWEAR' }).length === 1,
  'search includes style tags and ignores letter case',
);
check(
  filterWardrobeItems(items, { category: 'top', colorFamily: 'Neutrals', fit: 'Regular' })[0].id === 'b',
  'metadata filters can be combined',
);
check(
  filterWardrobeItems(items, { sort: 'recent' })[0].id === 'b',
  'recently-added sorting uses creation timestamps',
);

state = addPersonalItem(createEmptyWardrobeState(), fixture());
state = moveToRecentlyDeleted(state, 'top-linen');
state = permanentlyDeleteItem(state, 'top-linen');
check(state.recentlyDeleted.length === 0, 'permanent deletion removes a Recently Deleted record');
check(JSON.stringify(OCCASIONS) === JSON.stringify(require('../src/features/suggest/outfitRecommendations').OCCASIONS), 'wardrobe occasion options stay aligned with Suggest');
check(['Work', 'Date Night', 'Casual', 'Formal', 'Gym'].every((occasion) => OCCASIONS.includes(occasion)), 'existing occasion tags remain supported');

console.log(`Passed ${checks} wardrobe CRUD, isolation, recovery, and filter checks.`);
