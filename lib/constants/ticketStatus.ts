/** Ticket row `tickets.status` values used across the app. */

export const TICKET_STATUS_PRE_REGISTERED = "pre_registered" as const
export const TICKET_STATUS_CHECKED_IN = "checked_in" as const
export const TICKET_STATUS_COMPLETED = "completed" as const

export type TicketStatusValue =
  | typeof TICKET_STATUS_PRE_REGISTERED
  | typeof TICKET_STATUS_CHECKED_IN
  | typeof TICKET_STATUS_COMPLETED
