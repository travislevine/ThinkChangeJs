import { connectBikeParkPowerSync, db } from "@/lib/db/powersync"

const DEBOUNCE_MS = 450

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Connect when disconnected — does not tear down a healthy session (tab focus catch-up).
 */
export async function ensurePowerSyncConnected(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }
  try {
    if (db.connected || db.connecting) {
      return
    }
    await connectBikeParkPowerSync()
  } catch {
    // `db.registerListener({ statusChanged })` updates UI (e.g. SyncFailureBanner).
  }
}

/**
 * Disconnect (if needed) and reconnect PowerSync immediately — for manual “refresh / retry” actions.
 */
export async function reconnectPowerSyncNow(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }
  try {
    if (db.connected || db.connecting) {
      await db.disconnect()
    }
    await connectBikeParkPowerSync()
  } catch {
    // `db.registerListener({ statusChanged })` updates UI (e.g. SyncFailureBanner).
  }
}

/**
 * After tab focus: connect if needed, or full reconnect only when the pipeline reports errors.
 */
export async function catchUpPowerSyncAfterVisibility(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  const status = db.currentStatus
  if (!status.connected && !status.connecting) {
    await ensurePowerSyncConnected()
    return
  }

  const flow = status.dataFlowStatus
  if (flow?.downloadError != null || flow?.uploadError != null) {
    await reconnectPowerSyncNow()
  }
}

/**
 * Coalesce rapid tab-focus events into a single catch-up (no disconnect when already healthy).
 */
export function scheduleDebouncedPowerSyncCatchUp(): void {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void catchUpPowerSyncAfterVisibility()
  }, DEBOUNCE_MS)
}

/**
 * Coalesce rapid triggers into a full reconnect — use after a confirmed offline gap.
 */
export function scheduleDebouncedPowerSyncReconnect(): void {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void reconnectPowerSyncNow()
  }, DEBOUNCE_MS)
}
