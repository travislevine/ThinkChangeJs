import { OPERATOR_PAGE_CACHE_NAME } from "@/lib/constants/pwa"
import { OPERATOR_ROUTES } from "@/lib/constants/operatorRoutes"
import { createOperatorPageRequest } from "@/lib/pwa/operatorPageRequest"

/**
 * Stores full HTML documents for each operator route (client-side, while online).
 * Same cache name as the service worker — survives closing and reopening the installed PWA.
 */
export async function cacheOperatorPagesInBrowser(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine || !("caches" in window)) {
    return
  }

  const cache = await caches.open(OPERATOR_PAGE_CACHE_NAME)
  const origin = window.location.origin

  for (const path of OPERATOR_ROUTES) {
    try {
      const request = createOperatorPageRequest(path, origin)
      const response = await fetch(request)
      if (response.ok && !response.redirected) {
        await cache.put(request, response)
      }
    } catch {
      // Best-effort — SW install/activate also populates this cache.
    }
  }
}

/** True when every operator route has a cached HTML document (for cold-start offline). */
export async function areOperatorPagesCached(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false
  }

  const cache = await caches.open(OPERATOR_PAGE_CACHE_NAME)
  const origin = window.location.origin

  for (const path of OPERATOR_ROUTES) {
    const request = createOperatorPageRequest(path, origin)
    const hit = await cache.match(request, { ignoreSearch: true })
    if (!hit) {
      return false
    }
  }

  return true
}
