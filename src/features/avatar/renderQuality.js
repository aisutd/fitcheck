/**
 * Auto starts conservatively and reduces detail for limited graphics or slow startup.
 * @param {string} mode
 * @param {number} maxTextureSize
 * @param {number} startupMs
 */
function resolveRenderQuality(mode, maxTextureSize = 0, startupMs = 0) {
  if (mode === 'low') return 'low';
  if (mode === 'standard') return 'standard';
  return maxTextureSize < 4096 || startupMs > 2500 ? 'low' : 'standard';
}
/** @param {string} quality */
function renderSettings(quality) {
  return quality === 'low'
    ? { dpr: 1, segments: 10 }
    : { dpr: 1.5, segments: 24 };
}
module.exports = { resolveRenderQuality, renderSettings };
