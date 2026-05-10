export interface PickupTicketSummary {
  ticketId: string
  ticketNumber: number
  patronName: string
  mobile: string | null
  devicesRemaining: number
  status: string
}

export interface PickupTicketDeviceLine {
  deviceType: string
  quantity: number
}

/** Per device type: dropped off, already picked in earlier events, still on hand. */
export interface PickupTypeRemaining {
  deviceType: string
  dropped: number
  pickedPreviously: number
  remaining: number
}
