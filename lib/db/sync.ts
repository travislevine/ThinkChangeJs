import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
} from "@powersync/common"
import { UpdateType } from "@powersync/common"

import { isSupabaseConfigured, supabase } from "@/lib/db/supabase"

function canConnectPowerSync(): boolean {
  const endpoint = process.env.NEXT_PUBLIC_POWERSYNC_URL
  const token =
    process.env.NEXT_PUBLIC_POWERSYNC_TOKEN ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  return Boolean(endpoint && token)
}

async function applyCrudEntry(entry: CrudEntry): Promise<void> {
  const table = entry.table

  if (entry.op === UpdateType.DELETE) {
    const { error } = await supabase.from(table).delete().eq("id", entry.id)
    if (error) throw error
    return
  }

  if (entry.op === UpdateType.PATCH) {
    const { error } = await supabase
      .from(table)
      .update({ ...entry.opData })
      .eq("id", entry.id)
    if (error) throw error
    return
  }

  if (entry.op === UpdateType.PUT) {
    const row = { id: entry.id, ...entry.opData }
    const { error } = await supabase.from(table).upsert(row)
    if (error) throw error
  }
}

export function createBikeParkConnector(): PowerSyncBackendConnector {
  return {
    fetchCredentials: async () => {
      if (!canConnectPowerSync() || !isSupabaseConfigured()) {
        return null
      }
      return {
        endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL!,
        token:
          process.env.NEXT_PUBLIC_POWERSYNC_TOKEN ??
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    },

    uploadData: async (database: AbstractPowerSyncDatabase): Promise<void> => {
      let batch = await database.getCrudBatch()
      while (batch) {
        for (const entry of batch.crud) {
          await applyCrudEntry(entry)
        }
        await batch.complete()
        batch = await database.getCrudBatch()
      }
    },
  }
}
