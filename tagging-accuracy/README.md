# FitCheck — Tagging Accuracy Report

A focused React Native + TypeScript implementation of Task 6, compatible with Expo Go.

## Run the app

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
- Animated SVG accuracy ring with a lavender, violet, midnight, and pearl visual system
- Tap-to-switch dimension rail with animated metric reveals
- AI Insights treatment and an animated blurred information sheet
- JPG, PNG, and WebP outfit selection through Expo Image Picker
- An animated **Analyze Bias** flow backed by the secure Gemini API server in `../server`
- Evidence-qualified category findings that separate potential concerns from confirmed bias
- An honest empty state when no labeled accuracy tests have been completed

## Integrate the report

Copy `src/` into the FitCheck project, then register
`TaggingAccuracyReportScreen` with the app's existing navigator. Pass an object that matches
`AccuracyReport`:

```tsx
<TaggingAccuracyReportScreen report={accuracyReportFromApi} />
```

Until a labeled evaluation pipeline supplies results, `src/data/emptyAccuracyReport.ts` displays
**No tests completed**. A single uploaded image is not counted as an accuracy test because it has no
human-reviewed ground truth.

## Connect real bias analysis

The upload UI calls `src/services/biasAnalysis.ts`, which sends the image to the backend URL in
`EXPO_PUBLIC_API_BASE_URL`. Start `../server` with a server-side `GEMINI_API_KEY`; never place that
key in the Expo bundle. The backend validates the file, invokes Gemini 3.8 Flash with a structured
response schema, and returns four required evaluation categories.

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

For production aggregate statistics, return the same `AccuracyReport` shape from a labeled
model-evaluation endpoint. `overallAccuracy` and `testedAt` stay `null` until tests exist. The
`sampleCount` for a group may differ from the overall photo count because one evaluated photo can
contribute to several independent dimensions.
