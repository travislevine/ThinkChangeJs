import { isAppleWebKit } from "@/lib/platform/isAppleWebKit"
import { isInstalledPwa } from "@/lib/platform/isInstalledPwa"

import { isOfflineForNavigation } from "@/lib/navigation/isOfflineForNavigation"

/**
 * Full page loads when offline. Installed **Android/Chrome** PWAs also use document nav when
 * "online" (false-positive after airplane-mode cold start). **iPhone/iPad** installed PWAs use
 * client-side Next.js navigation when online for faster page changes; document nav only offline.
 */
export function shouldUseDocumentNavigation(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  if (isOfflineForNavigation()) {
    return true
  }
  if (isInstalledPwa() && !isAppleWebKit()) {
    return true
  }
  return false
}
