/**
 * Prefer full document navigation when the device has no network.
 * Uses `navigator.onLine` directly so routing works before the sync probe updates.
 */
export function isOfflineForNavigation(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine
}
