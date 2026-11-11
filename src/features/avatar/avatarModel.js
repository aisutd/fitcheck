const AVATAR_SCHEMA_VERSION = 1;

const AVATAR_OPTIONS = {
  skinTone: ['deep', 'tan', 'medium', 'light'],
  hairStyle: ['short', 'curly', 'long'],
  hairColor: ['dark', 'brown', 'copper'],
  bodyFrame: ['petite', 'average', 'tall'],
  outfitColor: ['forest', 'terracotta', 'blue', 'plum'],
};

const DEFAULT_AVATAR_CUSTOMIZATION = Object.freeze({
  schemaVersion: AVATAR_SCHEMA_VERSION,
  skinTone: 'medium',
  hairStyle: 'short',
  hairColor: 'dark',
  bodyFrame: 'average',
  outfitColor: 'forest',
});

function isAvatarCustomization(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.schemaVersion === AVATAR_SCHEMA_VERSION &&
    Object.entries(AVATAR_OPTIONS).every(([key, options]) => options.includes(value[key])),
  );
}

function updateAvatarCustomization(customization, key, value) {
  if (
    !isAvatarCustomization(customization) ||
    !Object.prototype.hasOwnProperty.call(AVATAR_OPTIONS, key) ||
    !AVATAR_OPTIONS[key].includes(value)
  ) {
    throw new Error('The avatar setting is invalid and was not changed.');
  }
  return { ...customization, [key]: value };
}

module.exports = {
  AVATAR_OPTIONS,
  AVATAR_SCHEMA_VERSION,
  DEFAULT_AVATAR_CUSTOMIZATION,
  isAvatarCustomization,
  updateAvatarCustomization,
};
