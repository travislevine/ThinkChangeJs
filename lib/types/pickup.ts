export interface PickupTicketSummary {
  ticketId: string
  ticketNumber: number
  patronName: string
  mobile: string | null
  devicesRemaining: number
  status: string
}
