import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"

/** Form state for Check Ticket edit sheet (Phase 4.4). Ticket number is loaded separately (read-only). */
export interface CheckTicketEditFormState {
  patronName: string
  mobile: string
  email: string
  devices: DropOffDeviceRow[]
}
