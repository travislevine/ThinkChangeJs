import "@/lib/polyfills/insecureContextClient"
import { PowerSyncDatabase } from "@powersync/web"

import { bikeParkSchema } from "@/lib/db/schema"
import { createBikeParkConnector } from "@/lib/db/sync"

function isInsecureContext(): boolean {
  if (typeof window === "undefined") return false
  // Secure contexts include https:// and http://localhost. LAN http://IP is insecure.
  return window.isSecureContext !== true
}

export const db = new PowerSyncDatabase({
  schema: bikeParkSchema,
  database: {
    dbFilename: "bikepark.db",
  },
  ...(isInsecureContext()
    ? {
        // In insecure contexts, `navigator.locks` is missing in workers on some browsers.
        // Keep DB work on the main thread where our polyfills apply.
        flags: {
          useWebWorker: false,
          enableMultiTabs: false,
        },
      }
    : {}),
})

let initPromise: Promise<void> | null = null

export function ensurePowerSyncInitialized(): Promise<void> {
  initPromise ??= db.init()
  return initPromise
}

/**
 * Connects the shared `db` to PowerSync Cloud (download) and registers `uploadData` for uploads to Supabase.
 * No-op when env is incomplete or credentials resolve to null (local-only mode).
 */
export async function connectBikeParkPowerSync(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    if (typeof window === "undefined") {
      return { ok: true }
    }
    if (db.connected || db.connecting) {
      return { ok: true }
    }
    const connector = createBikeParkConnector()
    const creds = await connector.fetchCredentials()
    if (!creds) {
      return { ok: true }
    }
    await db.connect(connector)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
