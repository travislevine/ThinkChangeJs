"use client"

import * as React from "react"

import { useSyncStatus } from "@/contexts/SyncStatusContext"
import type { SyncState } from "@/lib/types/sync"

function syncLabel(state: SyncState): string {
  switch (state) {
    case "connected":
      return "Synced"
    case "syncing":
      return "Syncing..."
    case "pending":
      return "Pending sync"
    case "offline":
      return "Offline"
  }
}

function dotClasses(state: SyncState): string {
  switch (state) {
    case "connected":
      return "bg-emerald-500"
    case "offline":
      return "bg-red-500"
    case "syncing":
    case "pending":
      return "bg-amber-500 animate-pulse"
  }
}

function formatLastSyncedAt(lastSyncedAt: Date | null): string {
  if (!lastSyncedAt) return "Never synced"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    lastSyncedAt
  )
}

export function SyncStatusIndicator() {
  const { syncState, lastSyncedAt } = useSyncStatus()
  const label = syncLabel(syncState)

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2">
        <span className={"h-2.5 w-2.5 rounded-full " + dotClasses(syncState)} aria-hidden="true" />
        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-50">{label}</span>
      </span>
      <span className="hidden text-xs text-emerald-800/80 sm:inline dark:text-emerald-100/80">
        {formatLastSyncedAt(lastSyncedAt)}
      </span>
    </div>
  )
}

SyncStatusIndicator.displayName = "SyncStatusIndicator"

