const assert = require('node:assert/strict');
const {
  AVATAR_OPTIONS,
  DEFAULT_AVATAR_CUSTOMIZATION,
  isAvatarCustomization,
  updateAvatarCustomization,
} = require('../src/features/avatar/avatarModel');

let checks = 0;

function check(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}

check(isAvatarCustomization(DEFAULT_AVATAR_CUSTOMIZATION), 'default avatar customization is valid');

for (const [key, values] of Object.entries(AVATAR_OPTIONS)) {
  for (const value of values) {
    const next = updateAvatarCustomization(DEFAULT_AVATAR_CUSTOMIZATION, key, value);
    check(next[key] === value, `${key} accepts supported value "${value}"`);
    check(isAvatarCustomization(next), `${key} change preserves a valid customization`);
  }
}

check(!isAvatarCustomization({ ...DEFAULT_AVATAR_CUSTOMIZATION, skinTone: 'unknown' }), 'unknown avatar options are rejected');
check(!isAvatarCustomization({ ...DEFAULT_AVATAR_CUSTOMIZATION, schemaVersion: 99 }), 'unsupported avatar schema versions are rejected');
assert.throws(
  () => updateAvatarCustomization(DEFAULT_AVATAR_CUSTOMIZATION, 'skinTone', 'unknown'),
  /invalid and was not changed/,
);
checks += 1;
assert.throws(
  () => updateAvatarCustomization(DEFAULT_AVATAR_CUSTOMIZATION, 'unknownSetting', 'value'),
  /invalid and was not changed/,
);
checks += 1;

console.log(`Passed ${checks} avatar model validation and customization checks.`);
