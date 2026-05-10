/** Rows for the Check Ticket (`/check-ticket`) ticket lookup list. */

export interface CheckTicketTicketRow {
  ticketId: string
  /** SQLite rowid — proxy for insert order when sorting “newest first”. */
  rowid: number
  ticketNumber: number
  patronName: string
  mobile: string | null
  email: string | null
  totalDevices: number
  devicesRemaining: number
  status: string
}
