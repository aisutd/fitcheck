# FitCheck — Tagging Accuracy Report

A focused React Native + TypeScript implementation of Task 6, compatible with Expo Go.

## Run the demo

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a`/`i` in the Expo terminal.

## What is included

- Overall clothing-recognition accuracy and tested-photo count
- Breakdowns for clothing categories, patterns, skin tones, and body types
- Accessible progress bars and a compact comparison chart
- Orange “Needs work” treatment for results below a configurable threshold
- A reusable floating ⓘ button with an accuracy explanation modal
- Clearly labeled demonstration data, isolated from the UI
- Animated SVG accuracy ring with a lavender, violet, midnight, and pearl visual system
- Tap-to-switch dimension rail with animated metric reveals
- AI Insights treatment and an animated blurred information sheet

## Integrate the report

Copy `src/` into the FitCheck project, then register
`TaggingAccuracyReportScreen` with the app's existing navigator. Pass an object that matches
`AccuracyReport`:

```tsx
<TaggingAccuracyReportScreen report={accuracyReportFromApi} />
```

The temporary values are in `src/data/demoAccuracyReport.ts`. Keeping data outside the screen
makes the eventual API replacement a one-line prop change.

## Add the floating button to Closet

Place the component near the end of the Closet screen's root container. That container should use
`flex: 1` so the button can anchor to its bottom-right corner.

```tsx
<View style={{ flex: 1 }}>
  <ClosetContent />
  <AccuracyInfoButton
    totalPhotos={accuracyReport.totalPhotos}
    lowAccuracyThreshold={accuracyReport.lowAccuracyThreshold}
    onViewReport={() => navigation.navigate('TaggingAccuracyReport')}
  />
</View>
```

If `onViewReport` is omitted, the popup still works and simply shows a **Got it** action.

## Data contract

Accuracy values use a `0–100` scale. The UI clamps progress-bar widths defensively and determines
poor-performing groups from `lowAccuracyThreshold`; no category names or scores are hard-coded into
the screen.

For production, return the same `AccuracyReport` shape from the model-evaluation endpoint and set
`isDemo` to `false`. The `sampleCount` for a group is allowed to differ from the overall photo count
because one evaluated photo can contribute to several independent dimensions.
