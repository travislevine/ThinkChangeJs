import "@/lib/polyfills/insecureContextClient"
import {
  PowerSyncDatabase,
  WASQLiteOpenFactory,
  WASQLiteVFS,
} from "@powersync/web"

import { bikeParkSchema } from "@/lib/db/schema"
import { createBikeParkConnector } from "@/lib/db/sync"
import { isAppleWebKit } from "@/lib/platform/isAppleWebKit"

const DB_FILENAME = "bikepark.db"

function isInsecureContext(): boolean {
  if (typeof window === "undefined") return false
  // Secure contexts include https:// and http://localhost. LAN http://IP is insecure.
  return window.isSecureContext !== true
}

function supportsOpfs(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function"
  )
}

function createPowerSyncDatabase(): PowerSyncDatabase {
  const insecure = isInsecureContext()
  const appleWebKit =
    typeof window !== "undefined" && isAppleWebKit() && !insecure

  if (appleWebKit && supportsOpfs()) {
    const enableMultiTabs = typeof SharedWorker !== "undefined"
    return new PowerSyncDatabase({
      schema: bikeParkSchema,
      database: new WASQLiteOpenFactory({
        dbFilename: DB_FILENAME,
        vfs: WASQLiteVFS.OPFSCoopSyncVFS,
        flags: {
          enableMultiTabs,
        },
      }),
      flags: {
        enableMultiTabs,
      },
    })
  }

  if (appleWebKit) {
    return new PowerSyncDatabase({
      schema: bikeParkSchema,
      database: {
        dbFilename: DB_FILENAME,
      },
      flags: {
        useWebWorker: false,
        enableMultiTabs: false,
      },
    })
  }

  if (insecure) {
    return new PowerSyncDatabase({
      schema: bikeParkSchema,
      database: {
        dbFilename: DB_FILENAME,
      },
      flags: {
        // In insecure contexts, `navigator.locks` is missing in workers on some browsers.
        useWebWorker: false,
        enableMultiTabs: false,
      },
    })
  }

  return new PowerSyncDatabase({
    schema: bikeParkSchema,
    database: {
      dbFilename: DB_FILENAME,
    },
  })
}

export const db = createPowerSyncDatabase()

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
