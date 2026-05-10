import "@/lib/polyfills/insecureContextClient"
import { PowerSyncDatabase } from "@powersync/web"

import { bikeParkSchema } from "@/lib/db/schema"

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
