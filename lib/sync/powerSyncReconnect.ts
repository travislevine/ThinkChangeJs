import { connectBikeParkPowerSync, db } from "@/lib/db/powersync"

const DEBOUNCE_MS = 450

let debounceTimer: ReturnType<typeof setTimeout> | null = null

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
 * Coalesce rapid triggers (tab focus, `online` flaps) into a single reconnect shortly after activity settles.
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
