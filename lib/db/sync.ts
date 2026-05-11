import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
} from "@powersync/common"
import { UpdateType } from "@powersync/common"

import {
  getPowerSyncSupabaseAccessToken,
  isSupabaseConfigured,
  supabase,
} from "@/lib/db/supabase"

/** Tables that exist in Postgres + `lib/db/schema.ts`; reject anything else from CRUD upload. */
export const BIKEPARK_SYNC_TABLES = [
  "archived_events",
  "devices",
  "events",
  "notes",
  "pickup_event_devices",
  "pickup_events",
  "ticket_numbers",
  "tickets",
] as const

export type BikeParkSyncTable = (typeof BIKEPARK_SYNC_TABLES)[number]

function isBikeParkSyncTable(name: string): name is BikeParkSyncTable {
  return (BIKEPARK_SYNC_TABLES as readonly string[]).includes(name)
}

function normalizePowerSyncEndpoint(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed
}

function canConnectPowerSync(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POWERSYNC_URL?.trim() && isSupabaseConfigured())
}

function isTicketsSoftDeletePatch(entry: CrudEntry): boolean {
  if (entry.table !== "tickets" || entry.op !== UpdateType.PATCH) {
    return false
  }
  const deletedAt = entry.opData?.deleted_at
  return deletedAt != null && deletedAt !== ""
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

  if (!isBikeParkSyncTable(table)) {
    throw new Error(`PowerSync upload: unknown table "${table}"`)
  }

  if (entry.op === UpdateType.DELETE) {
    const { error } = await s.from(table).delete().eq("id", entry.id)
    if (error) throw error
    return
  }

  if (entry.op === UpdateType.PATCH) {
    if (isTicketsSoftDeletePatch(entry)) {
      const { error } = await s.from(table).delete().eq("id", entry.id)
      if (error) throw error
      return
    }
    const { error } = await s.from(table).update({ ...entry.opData }).eq("id", entry.id)
    if (error) throw error
    return
  }

  if (entry.op === UpdateType.PUT) {
    const row = { ...(entry.opData as Record<string, unknown>), id: entry.id }
    const { error } = await s.from(table).upsert(row)
    if (error) throw error
  }
}

export function createBikeParkConnector(): PowerSyncBackendConnector {
  return {
    fetchCredentials: async () => {
      if (!canConnectPowerSync() || !isSupabaseConfigured()) {
        return null
      }
      const endpoint = normalizePowerSyncEndpoint(process.env.NEXT_PUBLIC_POWERSYNC_URL!)
      const staticToken = process.env.NEXT_PUBLIC_POWERSYNC_TOKEN?.trim()
      if (staticToken) {
        return { endpoint, token: staticToken }
      }

      const sessionAuth = await getPowerSyncSupabaseAccessToken()
      if (!sessionAuth) {
        return null
      }
      return {
        endpoint,
        token: sessionAuth.token,
        ...(sessionAuth.expiresAt != null ? { expiresAt: sessionAuth.expiresAt } : {}),
      }
    },

    uploadData: async (database: AbstractPowerSyncDatabase): Promise<void> => {
      if (!isSupabaseConfigured()) {
        return
      }
      await getPowerSyncSupabaseAccessToken()

      let transaction = await database.getNextCrudTransaction()
      while (transaction) {
        for (const entry of transaction.crud) {
          await applyCrudEntry(entry)
        }
        await transaction.complete()
        transaction = await database.getNextCrudTransaction()
      }
    },
  }
}
