"use client"

import * as React from "react"

import type { SyncState } from "@/lib/types/sync"

export interface SyncStatusContextValue {
  syncState: SyncState
  lastSyncedAt: Date | null
}

const SyncStatusContext = React.createContext<SyncStatusContextValue | null>(null)

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const value = React.useMemo<SyncStatusContextValue>(
    () => ({
      syncState: "offline",
      lastSyncedAt: null,
    }),
    []
  )

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>
}

export function useSyncStatus(): SyncStatusContextValue {
  const ctx = React.useContext(SyncStatusContext)
  if (!ctx) {
    throw new Error("useSyncStatus must be used within SyncStatusProvider")
  }
  return ctx
}
