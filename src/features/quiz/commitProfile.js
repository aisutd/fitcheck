/** Persist a confirmed profile before attempting non-critical draft cleanup. */
async function persistConfirmedProfile(profile, { saveProfile, clearDraft }) {
  await saveProfile(profile);
  try {
    await clearDraft();
    return { draftCleared: true, warning: '' };
  } catch {
    return { draftCleared: false, warning: 'Your preferences are saved and active, but the old draft could not be cleared. You can retry clearing it later.' };
  }
}
module.exports = { persistConfirmedProfile };
