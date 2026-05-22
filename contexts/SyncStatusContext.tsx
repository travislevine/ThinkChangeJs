"use client"

import * as React from "react"

import { SyncStatus } from "@powersync/common"

import { getDb } from "@/lib/db/powersync"
import {
  CONNECTIVITY_PROBE_INTERVAL_MS,
  CONNECTIVITY_PROBE_TIMEOUT_MS,
  CONNECTIVITY_PROBE_URL,
} from "@/lib/constants/sync"
import { toAppSyncState, toLastSyncedAt } from "@/lib/sync/appSyncState"
import { formatSyncFlowError } from "@/lib/sync/formatSyncFlowError"
import {
  reconnectPowerSyncNow,
  scheduleDebouncedPowerSyncCatchUp,
  scheduleDebouncedPowerSyncReconnect,
} from "@/lib/sync/powerSyncReconnect"
import type { SyncState } from "@/lib/types/sync"

export interface SyncStatusContextValue {
  syncState: SyncState
  lastSyncedAt: Date | null
  hasSyncError: boolean
  /** Stable-ish key for the current download/upload error; empty when none (Phase 5.4 dismiss logic). */
  syncIssueFingerprint: string
  /** Human-readable detail from PowerSync (download/upload pipeline). */
  syncErrorDetail: string | null
  /** Snapshot from PowerSync `db.currentStatus` (updated via `registerListener`). */
  powerSync: {
    connected: boolean
    connecting: boolean
    hasSynced: boolean | undefined
    downloading: boolean
    uploading: boolean
  }
  /** Manual reconnect (Park / Check Ticket refresh buttons, banner “Retry sync”). */
  retrySync: () => Promise<void>
  /** Same as `retrySync` — explicit name for Phase 6.3 “request sync” call sites. */
  requestSync: () => Promise<void>
  /** Debounced reconnect for visibility / coming back online (Phase 6.3). */
  scheduleSyncReconnect: () => void
}

const SyncStatusContext = React.createContext<SyncStatusContextValue | null>(null)

function readNavigatorOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

async function probeConnectivity(signal: AbortSignal): Promise<boolean> {
  if (!navigator.onLine) {
    return false
  }

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

const INITIAL_SYNC_STATUS = new SyncStatus({})

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState<boolean>(() => readNavigatorOnline())
  const [status, setStatus] = React.useState<SyncStatus>(INITIAL_SYNC_STATUS)

  const isOnlineRef = React.useRef(isOnline)
  React.useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  React.useEffect(() => {
    const database = getDb()
    setStatus(database.currentStatus)

    const removeDbListener = database.registerListener({
      statusChanged: (next) => {
        setStatus(next)
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

  /** Phase 6.3 — tab visible again: reconnect if disconnected / errors (not when already healthy). */
  React.useEffect(() => {
    const onVisibility = (): void => {
      if (document.visibilityState === "visible") {
        scheduleDebouncedPowerSyncCatchUp()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  /**
   * Connectivity probe + `online` event → `isOnline`. iOS installed PWAs often skip `offline`/`online`
   * in airplane mode, so we must reconnect when `isOnline` flips false → true, not only on `online`.
   */
  const prevIsOnlineRef = React.useRef<boolean | null>(null)
  React.useEffect(() => {
    if (prevIsOnlineRef.current === null) {
      prevIsOnlineRef.current = isOnline
      return
    }
    if (!prevIsOnlineRef.current && isOnline) {
      scheduleDebouncedPowerSyncReconnect()
    }
    prevIsOnlineRef.current = isOnline
  }, [isOnline])

  /** `online` may fire before the ping probe updates `isOnline` — always schedule reconnect. */
  React.useEffect(() => {
    const onOnline = (): void => {
      scheduleDebouncedPowerSyncReconnect()
    }
    window.addEventListener("online", onOnline)
    return () => {
      window.removeEventListener("online", onOnline)
    }
  }, [])

  const syncState = React.useMemo<SyncState>(() => toAppSyncState(isOnline, status), [isOnline, status])
  const lastSyncedAt = React.useMemo<Date | null>(() => toLastSyncedAt(status), [status])
  const syncIssueFingerprint = React.useMemo(() => {
    const flow = status.dataFlowStatus
    const parts: string[] = []
    if (flow?.downloadError != null) {
      parts.push(`download:${formatSyncFlowError(flow.downloadError)}`)
    }
    if (flow?.uploadError != null) {
      parts.push(`upload:${formatSyncFlowError(flow.uploadError)}`)
    }
    return parts.join("|")
  }, [status])

  const hasSyncError = syncIssueFingerprint.length > 0

  const syncErrorDetail = React.useMemo(() => {
    const flow = status.dataFlowStatus
    const parts: string[] = []
    if (flow?.downloadError != null) {
      parts.push(`Download: ${formatSyncFlowError(flow.downloadError)}`)
    }
    if (flow?.uploadError != null) {
      parts.push(`Upload: ${formatSyncFlowError(flow.uploadError)}`)
    }
    return parts.length > 0 ? parts.join(" · ") : null
  }, [status])

  const retrySync = React.useCallback(async (): Promise<void> => {
    await reconnectPowerSyncNow()
  }, [])

  const requestSync = retrySync

  const scheduleSyncReconnect = React.useCallback(() => {
    scheduleDebouncedPowerSyncCatchUp()
  }, [])

  const powerSync = React.useMemo(
    () => ({
      connected: status.connected,
      connecting: status.connecting,
      hasSynced: status.hasSynced,
      downloading: status.dataFlowStatus.downloading ?? false,
      uploading: status.dataFlowStatus.uploading ?? false,
    }),
    [status]
  )

  const value = React.useMemo<SyncStatusContextValue>(
    () => ({
      syncState,
      lastSyncedAt,
      hasSyncError,
      syncIssueFingerprint,
      syncErrorDetail,
      powerSync,
      retrySync,
      requestSync,
      scheduleSyncReconnect,
    }),
    [
      syncState,
      lastSyncedAt,
      hasSyncError,
      syncIssueFingerprint,
      syncErrorDetail,
      powerSync,
      retrySync,
      requestSync,
      scheduleSyncReconnect,
    ]
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
