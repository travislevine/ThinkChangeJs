import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import { db } from "@/lib/db/powersync"
import type { CheckTicketEditFormState } from "@/lib/types/checkTicketEdit"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import { sumDeviceRowQuantities } from "@/lib/utils/checkTicketEditValidation"

type TicketRow = {
  ticket_number: number | string | null
  patron_name: string | null
  mobile: string | null
  email: string | null
  total_devices: number | string | null
  devices_remaining: number | string | null
}

type DeviceRow = {
  device_type: string | null
  quantity: number | string | null
  colour: string | null
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function toDeviceType(v: string | null): DropOffDeviceRow["deviceType"] {
  const s = String(v ?? "Other")
  if ((DEVICE_CATEGORIES as readonly string[]).includes(s)) {
    return s as DropOffDeviceRow["deviceType"]
  }
  return "Other"
}

function toColour(v: string | null): DropOffDeviceRow["colour"] {
  const s = String(v ?? "Other")
  if ((COLOURS as readonly string[]).includes(s)) {
    return s as DropOffDeviceRow["colour"]
  }
  return "Other"
}

function newDeviceRow(): DropOffDeviceRow {
  return {
    id: crypto.randomUUID(),
    deviceType: DEVICE_CATEGORIES[0],
    quantity: 1,
    colour: COLOURS[0],
  }
}

export type LoadCheckTicketEditStateOk = {
  ok: true
  ticketNumber: number
  baselineTotal: number
  baselineRemaining: number
  form: CheckTicketEditFormState
}

export type LoadCheckTicketEditStateErr = {
  ok: false
  message: string
}

export async function loadCheckTicketEditState(
  ticketId: string,
  eventId: string
): Promise<LoadCheckTicketEditStateOk | LoadCheckTicketEditStateErr> {
  try {
    const ticket = await db.getOptional<TicketRow>(
      "SELECT ticket_number, patron_name, mobile, email, total_devices, devices_remaining FROM tickets WHERE id = ? AND event_id = ? AND deleted_at IS NULL LIMIT 1",
      [ticketId, eventId]
    )
    if (!ticket) {
      return { ok: false, message: "Ticket not found." }
    }
    const devices = await db.getAll<DeviceRow>(
      "SELECT device_type, quantity, colour FROM devices WHERE ticket_id = ?",
      [ticketId]
    )

    const num = asInt(ticket.ticket_number)
    const dbTotal = Math.max(0, asInt(ticket.total_devices))
    const remaining = Math.max(0, asInt(ticket.devices_remaining))

    const deviceRows: DropOffDeviceRow[] =
      devices.length > 0
        ? devices.map((d) => ({
            id: crypto.randomUUID(),
            deviceType: toDeviceType(d.device_type),
            quantity: Math.max(1, asInt(d.quantity)),
            colour: toColour(d.colour),
          }))
        : [newDeviceRow()]
    const rowSum = sumDeviceRowQuantities(deviceRows)
    const displayTotal = dbTotal > 0 ? dbTotal : Math.max(1, rowSum)

    const form: CheckTicketEditFormState = {
      patronName: String(ticket.patron_name ?? ""),
      mobile: String(ticket.mobile ?? ""),
      email: String(ticket.email ?? ""),
      totalDevices: String(displayTotal),
      devices: deviceRows,
    }

    return {
      ok: true,
      ticketNumber: num,
      baselineTotal: dbTotal,
      baselineRemaining: remaining,
      form,
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to load ticket.",
    }
  }
}
