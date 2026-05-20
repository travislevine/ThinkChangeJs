/**
 * True when running as an installed home-screen app (not a normal browser tab).
 * Chrome on iPad often reports `navigator.onLine === true` in airplane mode — use this
 * to decide when operator links must be full document navigations.
 */
export function isInstalledPwa(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true
  }

  if (window.matchMedia("(display-mode: fullscreen)").matches) {
    return true
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return navigatorWithStandalone.standalone === true
}
