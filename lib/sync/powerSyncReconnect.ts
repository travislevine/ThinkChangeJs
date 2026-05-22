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
 * After tab focus: full reconnect when disconnected, stuck connecting, or pipeline errors.
 * `ensurePowerSyncConnected` is not used here — it no-ops while `connecting` is true and can leave
 * the UI on "Pending sync" indefinitely after an offline period.
 */
export async function catchUpPowerSyncAfterVisibility(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  const status = db.currentStatus
  const flow = status.dataFlowStatus
  const hasFlowError = flow?.downloadError != null || flow?.uploadError != null

  if (!status.connected || hasFlowError) {
    await reconnectPowerSyncNow()
  }
}

/**
 * After connectivity is restored (probe or `online` event). Always reconnect so uploads queued
 * offline are flushed and stale WebSocket / error states are cleared (iOS PWA often skips `online`).
 */
export async function reconnectPowerSyncAfterNetworkRestore(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }
  await reconnectPowerSyncNow()
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
 * Coalesce rapid triggers into a full reconnect — use after connectivity returns.
 */
export function scheduleDebouncedPowerSyncReconnect(): void {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void reconnectPowerSyncAfterNetworkRestore()
  }, DEBOUNCE_MS)
}
