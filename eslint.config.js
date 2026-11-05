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
    files: ['src/features/privacy/**/*.ts', 'src/features/privacy/**/*.tsx', 'src/features/collections/TabScreen.js'],
    // Preserve the contributor's request/retry state transitions while loading external storage.
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    ignores: ["dist/**", "dist-web/**", "dist-ios/**", "test-results/**", ".venv/**", "services/**/node_modules/**"],
  }
]);
