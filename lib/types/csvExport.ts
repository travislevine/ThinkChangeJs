/** One flattened row for CSV export (Phase 9). */

export type ExportRowStatus = "Checked In" | "Checked Out"

export interface ExportRow {
  eventName: string
  ticketNumber: number
  patronName: string
  patronPhone: string
  checkInTime: string | null
  checkOutTime: string | null
  deviceTypes: string
  deviceQuantities: string
  deviceColours: string
  notes: string
  status: ExportRowStatus
}
