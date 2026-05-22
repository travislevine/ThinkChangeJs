"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { usePowerSyncReady } from "@/components/shared/PowerSyncProvider"
import { useSyncStatus } from "@/contexts/SyncStatusContext"
import { OPERATOR_ROUTES } from "@/lib/constants/operatorRoutes"
import { OFFLINE_ROUTE_WARM_DEFER_MS } from "@/lib/constants/sync"
import {
  areOperatorPagesCached,
  cacheOperatorPagesInBrowser,
} from "@/lib/pwa/cacheOperatorPages"
import { isInstalledPwa } from "@/lib/platform/isInstalledPwa"

function cacheUrlWithSerwist(path: string): void {
  if (typeof window === "undefined" || !window.serwist?.messageSW) {
    return
  }

  void window.serwist.messageSW({
    type: "CACHE_URLS",
    payload: { urlsToCache: [path] },
  })
}

async function warmRoute(path: string, router: ReturnType<typeof useRouter>): Promise<void> {
  try {
    router.prefetch(path)
  } catch {
    // Prefetch is best-effort (browser tab online).
  }

  await fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  }).catch(() => undefined)

  await fetch(path, {
    credentials: "same-origin",
    headers: {
      RSC: "1",
      Accept: "text/x-component",
    },
  }).catch(() => undefined)

  cacheUrlWithSerwist(path)
}

/**
 * Caches operator HTML for cold-start offline (installed PWA).
 * Deferred until PowerSync finishes its first sync so iPad first load is not competing
 * with route/HTML/RSC fetches on the same connection.
 */
function OfflineRouteWarmerInner(): null {
  const router = useRouter()

  React.useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) {
      return
    }

    let cancelled = false

    const warmRoutes = async (): Promise<void> => {
      await cacheOperatorPagesInBrowser()
      if (cancelled) return

      for (const path of OPERATOR_ROUTES) {
        if (path === "/" || cancelled) {
          continue
        }
        await warmRoute(path, router)
      }

      if (!isInstalledPwa() || cancelled) {
        return
      }

      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        if (await areOperatorPagesCached()) {
          return
        }
        await cacheOperatorPagesInBrowser()
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 400)
        })
      }
    }

    void warmRoutes()

    if (!("serviceWorker" in navigator)) {
      return () => {
        cancelled = true
      }
    }

    void navigator.serviceWorker.ready.then(() => {
      if (!cancelled) {
        void warmRoutes()
      }
    })

    const onControllerChange = (): void => {
      void warmRoutes()
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)
    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [router])

  return null
}

export function OfflineRouteWarmer(): React.ReactElement | null {
  const ready = usePowerSyncReady()
  const { syncState } = useSyncStatus()
  const [mayWarm, setMayWarm] = React.useState(false)

  React.useEffect(() => {
    if (!ready) {
      return
    }
    if (syncState === "connected") {
      setMayWarm(true)
      return
    }

    const timer = window.setTimeout(() => {
      setMayWarm(true)
    }, OFFLINE_ROUTE_WARM_DEFER_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [ready, syncState])

  if (!mayWarm) {
    return null
  }

  return <OfflineRouteWarmerInner />
}

OfflineRouteWarmer.displayName = "OfflineRouteWarmer"
