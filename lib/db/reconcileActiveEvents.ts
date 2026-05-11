import type { AbstractPowerSyncDatabase } from "@powersync/common"

interface ActiveEventRow {
  id: string
  started_at: number | string | null
  ticket_count: number | string
}

function compareActiveEvents(a: ActiveEventRow, b: ActiveEventRow): number {
  const ticketDiff = Number(b.ticket_count ?? 0) - Number(a.ticket_count ?? 0)
  if (ticketDiff !== 0) return ticketDiff
  return Number(b.started_at ?? 0) - Number(a.started_at ?? 0)
}

/**
 * Each client that seeded before sync could create its own `Default event` with `is_active = 1`.
 * Manual tickets attach to that device's event id; other devices only query their chosen active
 * event, so Check Ticket / Pickup look empty while Supabase still has the rows.
 *
 * Pick one canonical active event (most non-deleted tickets, then newest `started_at`), move
 * tickets onto it, and deactivate the rest. PowerSync uploads the repair to Postgres.
 */
export async function consolidateDuplicateActiveEvents(
  database: AbstractPowerSyncDatabase
): Promise<void> {
  const actives = await database.getAll<ActiveEventRow>(
    `SELECT e.id,
            e.started_at,
            (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.deleted_at IS NULL) AS ticket_count
       FROM events e
      WHERE e.is_active = 1`
  )
  if (actives.length <= 1) return

  const sorted = [...actives].sort(compareActiveEvents)
  const winnerId = sorted[0]!.id
  const loserIds = sorted.slice(1).map((e) => e.id)
  const now = Math.floor(Date.now() / 1000)

  await database.writeTransaction(async (tx) => {
    for (const loserId of loserIds) {
      await tx.execute(
        "UPDATE tickets SET event_id = ? WHERE event_id = ? AND deleted_at IS NULL",
        [winnerId, loserId]
      )
    }
    for (const loserId of loserIds) {
      await tx.execute("UPDATE events SET is_active = 0, ended_at = COALESCE(ended_at, ?) WHERE id = ?", [
        now,
        loserId,
      ])
    }
    await tx.execute("UPDATE events SET is_active = 1, ended_at = NULL WHERE id = ?", [winnerId])
  })
}
