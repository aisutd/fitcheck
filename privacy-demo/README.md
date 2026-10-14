# Fitcheck · Privacy & Data

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
