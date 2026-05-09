import type { AbstractPowerSyncDatabase } from "@powersync/common"

import {
  TICKET_NUMBER_POOL_MAX,
  TICKET_NUMBER_POOL_MIN,
} from "@/lib/constants/ticketPool"

const BATCH_SIZE = 100

export async function seedTicketPoolIfEmpty(database: AbstractPowerSyncDatabase): Promise<void> {
  const row = await database.getOptional<{ c: number }>(
    "SELECT COUNT(*) as c FROM ticket_numbers"
  )
  const count = Number(row?.c ?? 0)
  if (count > 0) {
    return
  }

  await database.writeTransaction(async (tx) => {
    let eventId = await tx.getOptional<{ id: string }>(
      "SELECT id FROM events WHERE is_active = 1 LIMIT 1"
    )

    if (!eventId) {
      const id = crypto.randomUUID()
      const startedAt = Math.floor(Date.now() / 1000)
      await tx.execute(
        "INSERT INTO events (id, name, started_at, ended_at, is_active) VALUES (?, ?, ?, NULL, 1)",
        [id, "Default event", startedAt]
      )
      eventId = { id }
    }

    const eid = eventId.id

    for (let start = TICKET_NUMBER_POOL_MIN; start <= TICKET_NUMBER_POOL_MAX; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE - 1, TICKET_NUMBER_POOL_MAX)
      const placeholders: string[] = []
      const params: unknown[] = []
      for (let n = start; n <= end; n++) {
        placeholders.push("(?, ?, ?, ?)")
        params.push(crypto.randomUUID(), n, "available", eid)
      }
      await tx.execute(
        `INSERT INTO ticket_numbers (id, number, status, event_id) VALUES ${placeholders.join(", ")}`,
        params
      )
    }
  })
}
