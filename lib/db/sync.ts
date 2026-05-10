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
  // `CrudEntry.table` is dynamic. We intentionally use an untyped Supabase call path here;
  // the strongly typed Supabase client remains available for other parts of the app.
  type UntypedResult = { error: unknown | null }
  type UntypedEq = (column: string, value: unknown) => Promise<UntypedResult>
  type UntypedTable = {
    delete: () => { eq: UntypedEq }
    update: (values: Record<string, unknown>) => { eq: UntypedEq }
    upsert: (values: Record<string, unknown>) => Promise<UntypedResult>
  }

  const s = supabase as unknown as { from: (table: string) => UntypedTable }
  const table = entry.table

  if (entry.op === UpdateType.DELETE) {
    const { error } = await s.from(table).delete().eq("id", entry.id)
    if (error) throw error
    return
  }

  if (entry.op === UpdateType.PATCH) {
    const { error } = await s.from(table).update({ ...entry.opData }).eq("id", entry.id)
    if (error) throw error
    return
  }

  if (entry.op === UpdateType.PUT) {
    const row = { id: entry.id, ...entry.opData }
    const { error } = await s.from(table).upsert(row as Record<string, unknown>)
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
