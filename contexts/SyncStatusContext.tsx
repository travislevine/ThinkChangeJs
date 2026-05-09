"use client"

import * as React from "react"

import { db } from "@/lib/db/powersync"
import { toAppSyncState, toLastSyncedAt } from "@/lib/sync/appSyncState"
import type { SyncState } from "@/lib/types/sync"

export interface SyncStatusContextValue {
  syncState: SyncState
  lastSyncedAt: Date | null
}

const SyncStatusContext = React.createContext<SyncStatusContextValue | null>(null)

function readNavigatorOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [syncState, setSyncState] = React.useState<SyncState>(() =>
    toAppSyncState(readNavigatorOnline(), db.currentStatus)
  )
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(() =>
    toLastSyncedAt(db.currentStatus)
  )

  React.useEffect(() => {
    const apply = (status = db.currentStatus): void => {
      const online = readNavigatorOnline()
      setSyncState(toAppSyncState(online, status))
      setLastSyncedAt(toLastSyncedAt(status))
    }

    apply()

    const removeDbListener = db.registerListener({
      statusChanged: (status) => {
        apply(status)
      },
    })

    const onConnectivity = (): void => {
      apply()
    }

    window.addEventListener("online", onConnectivity)
    window.addEventListener("offline", onConnectivity)

    return () => {
      removeDbListener()
      window.removeEventListener("online", onConnectivity)
      window.removeEventListener("offline", onConnectivity)
    }
  }, [])

  const value = React.useMemo<SyncStatusContextValue>(
    () => ({
      syncState,
      lastSyncedAt,
    }),
    [syncState, lastSyncedAt]
  )

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>
}

SyncStatusProvider.displayName = "SyncStatusProvider"

export function useSyncStatus(): SyncStatusContextValue {
  const ctx = React.useContext(SyncStatusContext)
  if (!ctx) {
    throw new Error("useSyncStatus must be used within SyncStatusProvider")
  }
  return ctx
}
