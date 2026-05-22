import type { AbstractPowerSyncDatabase } from "@powersync/common"

import { ensureServerTicketPool } from "@/lib/db/ensureServerTicketPool"
import {
  TICKET_NUMBER_POOL_MAX,
  TICKET_NUMBER_POOL_MIN,
} from "@/lib/constants/ticketPool"

const BATCH_SIZE = 100

async function getTicketNumberCountForEvent(
  database: AbstractPowerSyncDatabase,
  eventId: string
): Promise<number> {
  const row = await database.getOptional<{ c: number }>(
    "SELECT COUNT(*) as c FROM ticket_numbers WHERE event_id = ?",
    [eventId]
  )
  return Number(row?.c ?? 0)
}

async function resolveActiveEventId(
  database: AbstractPowerSyncDatabase
): Promise<string | null> {
  let eventId = await database.getOptional<{ id: string }>(
    "SELECT id FROM events WHERE is_active = 1 ORDER BY started_at DESC LIMIT 1"
  )

  if (!eventId) {
    eventId = await database.getOptional<{ id: string }>(
      "SELECT id FROM events ORDER BY started_at DESC LIMIT 1"
    )
    if (eventId) {
      await database.execute("UPDATE events SET is_active = 1, ended_at = NULL WHERE id = ?", [
        eventId.id,
      ])
    }
  }

  if (!eventId) {
    const id = crypto.randomUUID()
    const startedAt = Math.floor(Date.now() / 1000)
    await database.execute(
      "INSERT INTO events (id, name, started_at, ended_at, is_active) VALUES (?, ?, ?, NULL, 1)",
      [id, "Default event", startedAt]
    )
    return id
  }

  return eventId.id
}

/** Local-only fallback when Supabase is unreachable (offline greenfield). */
async function seedTicketPoolLocally(
  database: AbstractPowerSyncDatabase,
  eventId: string
): Promise<void> {
  await database.writeTransaction(async (tx) => {
    for (let start = TICKET_NUMBER_POOL_MIN; start <= TICKET_NUMBER_POOL_MAX; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE - 1, TICKET_NUMBER_POOL_MAX)
      const placeholders: string[] = []
      const params: unknown[] = []
      for (let n = start; n <= end; n++) {
        placeholders.push("(?, ?, ?, ?)")
        params.push(crypto.randomUUID(), n, "available", eventId)
      }
      await tx.execute(
        `INSERT INTO ticket_numbers (id, number, status, event_id) VALUES ${placeholders.join(", ")}`,
        params
      )
    }
  })
}

/**
 * Ensures ticket numbers 1–1500 exist for the active event.
 * Prefer server seed (download) over local insert + upload (slow on all devices, especially iPad).
 */
export async function seedTicketPoolIfEmpty(database: AbstractPowerSyncDatabase): Promise<void> {
  const eventId = await resolveActiveEventId(database)
  if (!eventId) {
    return
  }

  if ((await getTicketNumberCountForEvent(database, eventId)) > 0) {
    return
  }

  const serverSeeded = await ensureServerTicketPool(eventId)
  if (serverSeeded) {
    return
  }

  if ((await getTicketNumberCountForEvent(database, eventId)) > 0) {
    return
  }

  await seedTicketPoolLocally(database, eventId)
}
