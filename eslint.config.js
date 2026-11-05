const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'scripts/**'] },
  { files: ['src/screens/AvatarStudioScreen.js'], rules: { 'react/no-unknown-property': 'off' } },
]);
