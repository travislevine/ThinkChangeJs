"use client"

import * as React from "react"

import { isOfflineForNavigation } from "@/lib/navigation/isOfflineForNavigation"

/** Reactive offline flag for link / router fallbacks (updates on `online` / `offline`). */
export function useOfflineForNavigation(): boolean {
  const [offline, setOffline] = React.useState(() => isOfflineForNavigation())

  React.useEffect(() => {
    const sync = (): void => {
      setOffline(isOfflineForNavigation())
    }

    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])

  return offline
}
