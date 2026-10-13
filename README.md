# Muse — Virtual Try-On

A React Native / TypeScript Expo frontend with the Lavender Milk Tea palette. No backend or AI service is connected.

## Run

From this folder:

```sh
npm install
npm start
```

Scan the QR code with an Expo Go version compatible with SDK 57. The computer and phone should share a network. `npm run web` opens the browser preview; camera permission dialogs and camera capture should be verified on a physical iOS or Android device.

## Implementation

- `src/VirtualTryOn.tsx`: responsive screen, reusable UI components, independent photo state, guarded generation, and timed ellipsis.
- `src/photos.ts`: uncropped system image picker, just-in-time camera permission, validation and decode check. Cancellation and invalid replacements keep the existing image.
- `src/tryOn.ts`: abortable 2.6-second demo adapter. Replace it with an API request accepting the original two picker assets. No photos are uploaded by this app.
- `src/TryOnViewer.tsx`: Expo GL / Three.js studio with 360-degree drag, pinch zoom, Front/Side/Back presets, reset, loading/error recovery, and GPU cleanup. Rendering pauses when the screen or app is inactive.
- `src/loadDemoAvatar.ts`: reads the bundled GLB and handles native textures without browser DOM APIs. No third-party asset request is made by the viewer.
- `src/app/`: Expo Router stack. The upload screen stays mounted behind the viewer, preserving both photos on Back or Try Another. A browser refresh or app restart starts a new session.

The demo uses a fixed CC0 avatar from Innerscene / MakeHuman. See `assets/avatar/LICENSE.md` for provenance. The GLB is about 26 MB; original embedded textures are also extracted for native loading. This is a demo asset, not a likeness, garment fitting result, or verified AAA-quality character. Physical device visual and performance verification is still required. Three.js 0.166.1 is pinned for its WebGL1 fallback support with Expo GL; no `expo-three` or custom native build is required.

Save Look displays “Saving looks is coming soon!” and does not persist anything.

The other three navigation sections are placeholders. Photos are retained in memory for the current session, not persisted to a database or device storage.

## Device acceptance check

1. Confirm generation is disabled with zero photos and with only either photo.
2. Select each image, switch tabs, and confirm previews and checkmarks persist.
3. Cancel a replacement; the original preview should remain.
4. Deny camera access, then try again after enabling it in Settings.
5. With both images, generate and confirm cycling dots, no repeated taps, and navigation to Your Try-On with a clearly labeled fixed demo avatar.
6. Remove either image and confirm generation is disabled again.
7. Check a portrait image, a landscape garment, and a small screen with scrolling.
8. Drag through 360 degrees; verify Front/Side/Back take a smooth short rotation path. Pinch and use zoom controls at both limits, then reset.
9. Check full-body framing including shoes, material textures, relaxed pose, and shadows on physical iOS and Android devices. Confirm acceptable frame rate and no clipping.
10. Save Look must show only the coming-soon message. Back, Android hardware back, and Try Another must retain both uploads.

## Validation

`npx tsc --noEmit` checks TypeScript. `npx expo export --platform all` checks production bundling. Device-specific permission and capture behavior requires Expo Go on a device.

`npm run lint` checks Expo lint rules. `node --test tests/viewer.test.cjs` checks camera framing, zoom limits, shortest preset paths, GLB geometry parsing, and exact local texture integrity.

Visual verification was blocked because the in-app browser could not reach the local server and Windows Computer Use could not verify its browser URL. These checks do not certify native rendering or gesture behavior; complete the device checklist above.
