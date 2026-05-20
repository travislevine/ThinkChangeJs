/**
 * True on iPhone, iPad, iPod, and iPadOS devices that report as Mac (desktop mode).
 * Includes Chrome/Firefox on iOS — all use WebKit.
 */
export function isAppleWebKit(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }

  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/i.test(ua)) {
    return true
  }

  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
}
