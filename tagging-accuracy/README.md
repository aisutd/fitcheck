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
- A private local **Saved analyses** gallery with compressed thumbnails and restored AI findings
- Human verification controls that turn a completed analysis into a real recognition test
- Live average recognition confidence across up to 100 analyzed photos, analyzed-photo count, and evidence-based flag count
- Live category and shirt-pattern metrics from structured AI predictions, automatic visual confidence, and human confirmation
- A rubric-based skin-tone recognition-risk assessment that never claims confirmed demographic bias
- Optional, device-only body-type evaluation groups; Gemini never infers body type
- An honest empty state when no human-reviewed accuracy tests have been completed

## Integrate the report

Copy `src/` into the FitCheck project, then register
`TaggingAccuracyReportScreen` with the app's existing navigator. Pass an object that matches
`AccuracyReport`:

```tsx
<TaggingAccuracyReportScreen report={accuracyReportFromApi} />
```

Until a labeled evaluation pipeline supplies results, `src/data/emptyAccuracyReport.ts` displays
**No tests completed**. An uploaded image is counted only after the user reviews the clothing
description and marks it accurate or incorrect. The overall score is then calculated as confirmed
correct descriptions divided by reviewed photos; AI confidence and bias-risk scores are never used
as substitutes for accuracy.

The four dimension tabs are derived from saved reviews. Categories group the category verdict by
the AI's predicted garment label; Patterns show an automatic visual-confidence rating and use a
separate human pattern verdict for measured accuracy. Skin tones use Gemini's
broad visible-tone band and a separate 0–100 image-level recognition-risk rubric based on lighting,
contrast, occlusion, and garment boundaries. This is explicitly not proof of demographic bias. Body
types group the recognition verdict only when the user voluntarily selects a device-only label.

## Connect real bias analysis

The upload UI calls `src/services/biasAnalysis.ts`, which sends the image to the backend URL in
`EXPO_PUBLIC_API_BASE_URL`. Start `../server` with a server-side `GEMINI_API_KEY`; never place that
key in the Expo bundle. The backend validates the file, invokes the configured Gemini model with a structured
response schema, and returns four required evaluation categories.

Completed personal fairness checks are compressed and stored locally with AsyncStorage. Native
devices keep image previews in the app document directory; web keeps compact data-URL previews in
browser storage. The eight most recent analyses are retained, and users can remove individual items.
This local gallery is device-specific and does not provide cloud sync or multi-user storage.

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
