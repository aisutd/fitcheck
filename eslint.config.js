// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    files: ['src/features/avatar/AvatarFigure.js', 'src/features/avatar/QuizAvatarPreview.js', 'src/screens/AvatarStudioScreen.js'],
    // React Three Fiber uses Three.js attributes, not DOM attributes, on its scene elements.
    rules: { 'react/no-unknown-property': 'off' },
  },
  {
    ignores: ["dist/*"],
  }
]);
