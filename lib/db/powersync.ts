import "@/lib/polyfills/insecureContextClient"
import { PowerSyncDatabase } from "@powersync/web"

import { bikeParkSchema } from "@/lib/db/schema"
import { createBikeParkConnector } from "@/lib/db/sync"
import { isAppleWebKit } from "@/lib/platform/isAppleWebKit"

const DB_FILENAME = "bikepark.db"

/** Default PowerSync page cache (50 MB) is too heavy for many iPhones. */
const APPLE_CACHE_SIZE_KB = 8 * 1024

const INIT_RETRY_DELAYS_MS = [0, 400, 1200] as const

function isInsecureContext(): boolean {
  if (typeof window === "undefined") return false
  return window.isSecureContext !== true
}

function usesMainThreadSqlite(): boolean {
  return isInsecureContext() || isAppleWebKit()
}

function createPowerSyncDatabase(): PowerSyncDatabase {
  if (typeof window === "undefined") {
    throw new Error("PowerSync must be initialized in the browser.")
  }

  const mainThread = usesMainThreadSqlite()
  const apple = isAppleWebKit() && !isInsecureContext()

  return new PowerSyncDatabase({
    schema: bikeParkSchema,
    database: {
      dbFilename: DB_FILENAME,
      ...(apple ? { cacheSizeKb: APPLE_CACHE_SIZE_KB } : {}),
    },
    flags: {
      useWebWorker: !mainThread,
      enableMultiTabs: false,
      disableSSRWarning: true,
    },
  })
}

let dbInstance: PowerSyncDatabase | null = null
let initPromise: Promise<void> | null = null

function resetDbInstance(): void {
  dbInstance = null
  initPromise = null
}

/** Browser-only PowerSync singleton (lazy — avoids SSR picking the wrong profile). */
export function getDb(): PowerSyncDatabase {
  dbInstance ??= createPowerSyncDatabase()
  return dbInstance
}

function bindDbProperty(instance: PowerSyncDatabase, prop: string | symbol): unknown {
  const value = Reflect.get(instance as object, prop)
  if (typeof value === "function") {
    return (value as (...args: unknown[]) => unknown).bind(instance)
  }
  return value
}

/** Back-compat export used across hooks and contexts. */
export const db: PowerSyncDatabase = new Proxy({} as PowerSyncDatabase, {
  get(_target, prop) {
    if (typeof window === "undefined") {
      return undefined
    }
    return bindDbProperty(getDb(), prop)
  },
})

async function initDbWithRetries(): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < INIT_RETRY_DELAYS_MS.length; attempt++) {
    const delay = INIT_RETRY_DELAYS_MS[attempt]
    if (delay > 0) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, delay)
      })
    }

    resetDbInstance()

    try {
      await getDb().init()
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Offline database failed to initialize on this device/browser.")
}

export function resetPowerSyncInit(): void {
  resetDbInstance()
}

export function ensurePowerSyncInitialized(): Promise<void> {
  if (initPromise) {
    return initPromise
  }

  initPromise = initDbWithRetries().catch((error) => {
    initPromise = null
    throw error
  })

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
    const database = getDb()
    if (database.connected || database.connecting) {
      return { ok: true }
    }
    const connector = createBikeParkConnector()
    const creds = await connector.fetchCredentials()
    if (!creds) {
      return { ok: true }
    }
    await database.connect(connector)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
