import { isInstalledPwa } from "@/lib/platform/isInstalledPwa"

import { isOfflineForNavigation } from "@/lib/navigation/isOfflineForNavigation"

/**
 * Full page loads for operator routes when offline, or when running as an installed PWA
 * (Chrome often misreports `navigator.onLine` after a cold start in airplane mode).
 */
export function shouldUseDocumentNavigation(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  return isOfflineForNavigation() || isInstalledPwa()
}
