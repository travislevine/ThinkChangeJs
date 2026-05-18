"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { OPERATOR_ROUTES } from "@/lib/constants/operatorRoutes"

/**
 * While online, prefetch each operator route so Serwist caches RSC payloads for offline navigation.
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
