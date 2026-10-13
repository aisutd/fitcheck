export const clampZoom = (zoom: number) => Math.min(1.2, Math.max(0.8, zoom));
export const nearestAngle = (current: number, desired: number) => current + Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
export function fitDistance(height: number, width: number, aspect: number, fovDegrees = 32) {
  const tangent = Math.tan(fovDegrees * Math.PI / 360);
  return Math.max(height / (2 * tangent), width / (2 * tangent * aspect)) * 1.38;
}
