# Fitcheck · Privacy & Data

## Closet Visibility backend

Category deletion now persists sample record arrays after applying
`supabase/migrations/202610210003_category_records.sql`. Deleting closet items
also clears saved outfits. Empty arrays stay empty after refresh; failed saves
leave the previous records and the confirmation open. Counts and closet export
use the loaded sample records. This does not delete actual uploaded files.
The separate Delete All My Data control still clears only the current preview.

For the remaining preferences, also run
`supabase/migrations/202610210002_remaining_preferences.sql` in Supabase's SQL
Editor. Private Mirror, face/background protection, location removal,
personalization, retailer-sharing consent, and saved style/size/budget then
persist in the same owner-protected row. Forget preferences writes empty
style/size/budget values to the database. Toggle changes update only their own
fields. Until the migration is applied, the new controls show load errors and
remain disabled. Verify each setting by waiting for save confirmation and
refreshing in the same browser. Processing and retailer integrations are still
unconnected; the persisted switches are preferences only. Category deletion,
Delete All My Data, and closet export still operate on the demo records.

Photo retention and AI training consent also persist after applying
`supabase/migrations/202610210001_privacy_preferences.sql` in the Supabase SQL
Editor. They reuse the same owner-only policies and session. Consent defaults
off and records its latest change time. Photo retention defaults to after
processing. Changes update only their own fields. These controls store policy
preferences; no photo-deletion worker or AI-training pipeline is connected yet.
To verify, change each preference, wait for confirmation, refresh, and check
that all three settings persist independently. Withdraw AI consent and verify
that it also remains off after refreshing.

Closet Visibility now loads and saves `privacy_settings.closet_visibility` in
Supabase. This supersedes the local-only description below for that setting;
the other controls still use mock data. Actual closet sharing is not implemented.

Configure `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The standalone demo
requires anonymous sign-ins enabled and the `privacy_settings` table with
owner-only SELECT, INSERT, and UPDATE policies. A new user starts Private;
selecting an option creates or updates their row. The card displays loading,
save confirmation, and persistent errors, with Retry for loading failures.

Run from this directory with `npx expo start --clear`, then press `w`. Change
visibility, wait for “Visibility saved.”, and refresh in the same browser to
verify persistence. Clearing browser storage or using another browser creates
a separate anonymous identity. During integration, reuse the main app's signed-in
session and remove the anonymous sign-in fallback in `lib/closetVisibility.ts`.
The demo's Delete All My Data action still clears mock data only.

A single-screen React Native / Expo / TypeScript mockup. All interactions use local React state; no backend or real data deletion is involved.

## Run

```sh
npm install
npm start
```

Scan the QR code in Expo Go on an iPhone or Android device. Use an Expo Go version supporting this project's Expo SDK.

For a local browser preview, run `npm run web` and open `http://localhost:8081`. The browser preview uses the same React Native screen and local interactions.

```sh
npm run typecheck
```

Closet visibility defaults to Private and animates open and closed. Try-on photo retention offers after processing, after 24 hours, or manual deletion. AI training and retailer sharing default off. Photo protection switches and shopping personalization are local preview preferences; no actual image processing, AI provider, or retailer is connected.

You can edit or forget saved style, size, and budget; delete body photos, try-ons, closet items, or chat records separately; and clear all mock data. Deleting closet items also clears saved outfits. Cancel, backdrop tap, and Android back dismiss confirmations without changes.

Download My Closet exports current sample clothing metadata and outfits as JSON. Browsers download the file; Expo Go opens the device share sheet to save or share it. The mockup has no actual clothing-photo files to include.

The standalone back button displays a first-screen message. When embedding the exported `PrivacyDataScreen` in an existing navigation stack, pass `onBack={() => router.back()}` (Expo Router) or `onBack={() => navigation.goBack()}` (React Navigation), guarding with your navigator's `canGoBack()` when needed.

Settings and mock files reset when the app is reloaded.

Private Mirror defaults on and switches between faceless-avatar and photo-based try-on preferences. It is a UI preview only: avatar generation and on-device photo processing are not implemented.

The footer Privacy Policy link opens a dedicated, scrollable policy preview screen with back navigation. Its text describes only this demo; Fitcheck's official policy has not been supplied. Pass the official URL through the `privacyPolicyUrl` prop to open the published policy instead.
