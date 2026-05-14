import { db } from "@/lib/db/powersync"
import { sanitizeSmsToE164 } from "@/lib/utils/sanitizeSmsTo"

const SMS_NOTE_PREFIX = "📱 SMS sent to "

/**
 * Appends an auto-generated note after a successful SMS send.
 * `eventId` scopes the ticket lookup to the active event (same pattern as manual notes).
 */
export async function appendSmsNote(
  ticketId: string,
  to: string,
  eventId: string
): Promise<void> {
  const trimmed = to.trim()
  const displayNumber = trimmed ? sanitizeSmsToE164(trimmed) || trimmed : trimmed
  const content = `${SMS_NOTE_PREFIX}${displayNumber}`
  const now = Math.floor(Date.now() / 1000)

  await db.writeTransaction(async (tx) => {
    const row = await tx.getOptional<{ id: string }>(
      "SELECT id FROM tickets WHERE id = ? AND event_id = ? AND deleted_at IS NULL LIMIT 1",
      [ticketId, eventId]
    )
    if (!row?.id) {
      throw new Error("Ticket not found.")
    }
    await tx.execute(
      "INSERT INTO notes (id, ticket_id, content, recorded_at) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), ticketId, content, now]
    )
  })
}
