import type { SyncStatus } from "@powersync/common"

import type { SyncState } from "@/lib/types/sync"

export function toAppSyncState(online: boolean, status: SyncStatus): SyncState {
  if (!online) {
    return "offline"
  }

  const dataFlow = status.dataFlowStatus
  if (dataFlow?.downloadError || dataFlow?.uploadError) {
    return "pending"
  }
  if (!status.connected) {
    return status.connecting ? "syncing" : "pending"
  }

  if (status.hasSynced === false) {
    return "syncing"
  }

  const downloading = dataFlow?.downloading ?? false
  const uploading = dataFlow?.uploading ?? false
  if (downloading || uploading) {
    return "syncing"
  }

  return "connected"
}

export function toLastSyncedAt(status: SyncStatus): Date | null {
  return status.lastSyncedAt ?? null
}
