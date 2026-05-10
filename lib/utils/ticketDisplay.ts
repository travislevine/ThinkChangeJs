/** Human-readable ticket labels (e.g. banner numbers). */

export function formatTicketNumberLabel(ticketNumber: number): string {
  return `#${String(Math.max(0, Math.floor(ticketNumber))).padStart(3, "0")}`
}
