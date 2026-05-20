import { OPERATOR_PAGE_CACHE_NAME } from "@/lib/constants/pwa"
import { OPERATOR_ROUTES } from "@/lib/constants/operatorRoutes"

/**
 * Stores full HTML documents for each operator route (client-side, while online).
 * Same cache name as the service worker — survives closing and reopening the installed PWA.
 */
export async function cacheOperatorPagesInBrowser(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine || !("caches" in window)) {
    return
  }

  const cache = await caches.open(OPERATOR_PAGE_CACHE_NAME)

  for (const path of OPERATOR_ROUTES) {
    try {
      const response = await fetch(path, {
        credentials: "same-origin",
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
      })
      if (response.ok && !response.redirected) {
        await cache.put(path, response)
      }
    } catch {
      // Best-effort — SW install/activate also populates this cache.
    }
  }
}
