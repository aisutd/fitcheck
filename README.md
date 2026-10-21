# FitCheck

FitCheck is an Expo and React Native fashion styling prototype. The current app
includes occasion-aware outfit suggestions, separate Personal and Demo
wardrobes, locally stored clothing photos, and a locally saved 10-question
Know You style quiz. Avatar Studio adds an interactive, locally rendered
stylized 3D avatar with saved appearance and camera controls.

Personalized suggestions use the saved quiz profile and metadata entered for
each clothing item. The three ranked priorities use weights 6 / 3 / 1 in saved
order. Match percentages are normalized only across available, relevant
metadata; a percentage is omitted when there is no supporting metadata.
Weather matching uses the condition selected in Suggest and explicit garment
weather tags, not a live forecast. Familiar, Balanced, and Creative variety
controls and rerolls do not override the selected occasion or available items.

## Development

```bash
npm install
npm start
```

Run the focused logic checks with:

```bash
npm run test:quiz
npm run test:wardrobe
npm run test:recommendations
npm run test:avatar
```

Quiz drafts, confirmed style profiles, wardrobe records, and demo availability
are stored locally on the device. Clothing photos are copied into the app's
local documents directory. FitCheck does not send these records or photos to a
backend.

Avatar appearance preferences are stored locally. The avatar is a stylized
illustration, not a body scan or garment fit simulation. The renderer uses
React Three Fiber, Three.js, and Expo GL. Expo SDK 57 includes Expo GL in
Expo Go, but iOS Simulator OpenGL support may be unreliable; verify rendering
on a physical iOS device before relying on it.

## Docker

`docker-compose.yml` is a generic starter configuration and is not required to
run the Expo application.
