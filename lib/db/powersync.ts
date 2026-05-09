import { PowerSyncDatabase } from "@powersync/web"

import { bikeParkSchema } from "@/lib/db/schema"

export const db = new PowerSyncDatabase({
  schema: bikeParkSchema,
  database: {
    dbFilename: "bikepark.db",
  },
})

let initPromise: Promise<void> | null = null

export function ensurePowerSyncInitialized(): Promise<void> {
  initPromise ??= db.init()
  return initPromise
}
