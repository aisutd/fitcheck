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

The other three navigation sections are placeholders. Photos are retained in memory for the current session, not persisted to a database or device storage.

## Device acceptance check

1. Confirm generation is disabled with zero photos and with only either photo.
2. Select each image, switch tabs, and confirm previews and checkmarks persist.
3. Cancel a replacement; the original preview should remain.
4. Deny camera access, then try again after enabling it in Settings.
5. With both images, generate and confirm cycling dots, no repeated taps, and the coming-soon message.
6. Remove either image and confirm generation is disabled again.
7. Check a portrait image, a landscape garment, and a small screen with scrolling.

## Validation

`npx tsc --noEmit` checks TypeScript. `npx expo export --platform all` checks production bundling. Device-specific permission and capture behavior requires Expo Go on a device.
