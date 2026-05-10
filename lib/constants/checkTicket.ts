/** Sort modes for `/check-ticket` ticket list (Phase 4.2). */

export const CHECK_TICKET_SORT_MODE = {
  NEWEST_FIRST: "newest_first",
  TICKET_NUMBER_ASC: "ticket_number_asc",
} as const

export type CheckTicketSortMode =
  (typeof CHECK_TICKET_SORT_MODE)[keyof typeof CHECK_TICKET_SORT_MODE]

export function labelForCheckTicketSortMode(mode: CheckTicketSortMode): string {
  switch (mode) {
    case CHECK_TICKET_SORT_MODE.NEWEST_FIRST:
      return "Newest First"
    case CHECK_TICKET_SORT_MODE.TICKET_NUMBER_ASC:
      return "Ticket # ↑"
  }
}
