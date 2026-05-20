"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { OPERATOR_ROUTES } from "@/lib/constants/operatorRoutes"

function cacheUrlWithSerwist(path: string): void {
  if (typeof window === "undefined" || !window.serwist?.messageSW) {
    return
  }

  void window.serwist.messageSW({
    type: "CACHE_URLS",
    payload: { urlsToCache: [path] },
  })
}

function warmRoute(path: string, router: ReturnType<typeof useRouter>): void {
  try {
    router.prefetch(path)
  } catch {
    // Prefetch is best-effort.
  }

  void fetch(path, {
    credentials: "same-origin",
    headers: {
      RSC: "1",
      Accept: "text/x-component",
    },
  }).catch(() => undefined)

  void fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  }).catch(() => undefined)

  cacheUrlWithSerwist(path)
}

/**
 * While online, prefetch each operator route so Serwist caches HTML + RSC payloads for offline navigation.
 * Visit every page once after deploy, or rely on this warmer on the dashboard boot path.
 */
export function OfflineRouteWarmer(): null {
  const router = useRouter()

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const warmRoutes = (): void => {
      if (!navigator.onLine) return

      for (const path of OPERATOR_ROUTES) {
        if (path === "/") continue
        warmRoute(path, router)
      }
    }

    warmRoutes()

    if (!("serviceWorker" in navigator)) {
      return
    }

    void navigator.serviceWorker.ready.then(() => {
      warmRoutes()
    })

    const onControllerChange = (): void => {
      warmRoutes()
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [router])

  return null
}

OfflineRouteWarmer.displayName = "OfflineRouteWarmer"
