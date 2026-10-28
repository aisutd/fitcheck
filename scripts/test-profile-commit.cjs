const assert = require('node:assert/strict');
const { persistConfirmedProfile } = require('../src/features/quiz/commitProfile');
(async () => {
  const profile = { answers: { example: true } };
  const calls = [];
  const result = await persistConfirmedProfile(profile, {
    saveProfile: async (value) => { assert.equal(value, profile); calls.push('save'); },
    clearDraft: async () => { calls.push('clear'); },
  });
  assert.deepEqual(calls, ['save', 'clear']);
  assert.equal(result.draftCleared, true);
  let cleared = false;
  await assert.rejects(persistConfirmedProfile(profile, {
    saveProfile: async () => { throw new Error('disk full'); },
    clearDraft: async () => { cleared = true; },
  }), /disk full/);
  assert.equal(cleared, false, 'failed saves must preserve the draft');
  const cleanupFailure = await persistConfirmedProfile(profile, {
    saveProfile: async () => {}, clearDraft: async () => { throw new Error('cleanup unavailable'); },
  });
  assert.equal(cleanupFailure.draftCleared, false);
  assert.ok(cleanupFailure.warning.includes('saved and active'));
  console.log('Passed confirmed-profile persistence and cleanup-failure checks.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
