import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

/** Rows for the Check Ticket (`/check-ticket`) ticket lookup list. */

export interface CheckTicketNoteEntry {
  noteId: string
  content: string
  recordedAtSeconds: number
}

export type CheckTicketPickupEntryKind = "pickup" | "device_added"

export interface CheckTicketPickupEntry {
  pickupEventId: string
  kind: CheckTicketPickupEntryKind
  pickedUpAtSeconds: number
  devicesPickedUp: number
  deviceLines: PickupTicketDeviceLine[]
}

export interface CheckTicketTicketRow {
  ticketId: string
  ticketNumber: number
  patronName: string
  mobile: string | null
  email: string | null
  totalDevices: number
  devicesRemaining: number
  status: string
}
