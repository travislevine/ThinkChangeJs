import type { Colour } from "@/lib/constants/colours"
import type { DeviceCategory } from "@/lib/constants/deviceCategories"

export interface DropOffDeviceRow {
  id: string
  /** Empty string means unselected (placeholder in UI). */
  deviceType: DeviceCategory | ""
  quantity: number
  /** Empty string means unselected (placeholder in UI). */
  colour: Colour | ""
}

export interface DropOffBlankEntryFormState {
  ticketNumber: string
  patronName: string
  mobile: string
  email: string
  devices: DropOffDeviceRow[]
  notes: string
  /** Set when drop-off started from Pre-Registered select (ticket may have no number yet). */
  preRegisteredTicketId?: string
}
