/** Ticket row `tickets.status` values used across the app. */

export const TICKET_STATUS_PRE_REGISTERED = "pre_registered" as const
export const TICKET_STATUS_CHECKED_IN = "checked_in" as const
export const TICKET_STATUS_COMPLETED = "completed" as const

export type TicketStatusValue =
  | typeof TICKET_STATUS_PRE_REGISTERED
  | typeof TICKET_STATUS_CHECKED_IN
  | typeof TICKET_STATUS_COMPLETED

/** Labels for `tickets.status` on operator-facing lists (e.g. Check Ticket). */
export function labelForTicketRecordStatus(status: string): string {
  switch (status) {
    case TICKET_STATUS_PRE_REGISTERED:
      return "Pre-registered"
    case TICKET_STATUS_CHECKED_IN:
      return "Checked in"
    case TICKET_STATUS_COMPLETED:
      return "Completed"
    default:
      return status.trim() ? status : "Unknown"
  }
}

/** Badge style so pre-registered rows read differently from active/completed. */
export function badgeVariantForTicketStatus(status: string): "secondary" | "outline" {
  return status === TICKET_STATUS_PRE_REGISTERED ? "secondary" : "outline"
}
