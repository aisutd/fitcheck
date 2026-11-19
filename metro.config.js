/* global __dirname */
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Three r186's CommonJS entry uses Node-only process.emitWarning/require(esm).
// Fiber's native build uses require('three'), so resolve both import styles to
// the same portable ES module instead of executing that entry in Hermes.
const threeModule = path.join(path.dirname(require.resolve('three')), 'three.module.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: threeModule };
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
