"use client"

import * as React from "react"

import { db } from "@/lib/db/powersync"
import {
  CONNECTIVITY_PROBE_INTERVAL_MS,
  CONNECTIVITY_PROBE_TIMEOUT_MS,
  CONNECTIVITY_PROBE_URL,
} from "@/lib/constants/sync"
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

async function probeConnectivity(signal: AbortSignal): Promise<boolean> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), CONNECTIVITY_PROBE_TIMEOUT_MS)

  const abort = () => controller.abort()
  signal.addEventListener("abort", abort)

  try {
    const res = await fetch(CONNECTIVITY_PROBE_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    window.clearTimeout(timeout)
    signal.removeEventListener("abort", abort)
  }
}

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState<boolean>(() => readNavigatorOnline())
  const [status, setStatus] = React.useState(() => db.currentStatus)

  const isOnlineRef = React.useRef(isOnline)
  React.useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  React.useEffect(() => {
    const removeDbListener = db.registerListener({
      statusChanged: (status) => {
        setStatus(status)
      },
    })

    const onConnectivityHint = (): void => {
      setIsOnline(readNavigatorOnline())
    }

    window.addEventListener("online", onConnectivityHint)
    window.addEventListener("offline", onConnectivityHint)

    const ac = new AbortController()
    const tick = async (): Promise<void> => {
      const ok = await probeConnectivity(ac.signal)
      setIsOnline(ok)
    }

    void tick()
    const timer = window.setInterval(() => {
      void tick()
    }, CONNECTIVITY_PROBE_INTERVAL_MS)

    return () => {
      removeDbListener()
      window.removeEventListener("online", onConnectivityHint)
      window.removeEventListener("offline", onConnectivityHint)
      ac.abort()
      window.clearInterval(timer)
    }
  }, [])

  const syncState = React.useMemo<SyncState>(() => toAppSyncState(isOnline, status), [isOnline, status])
  const lastSyncedAt = React.useMemo<Date | null>(() => toLastSyncedAt(status), [status])

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
