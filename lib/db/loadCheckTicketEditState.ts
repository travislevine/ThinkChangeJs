import { db } from "@/lib/db/powersync"
import type { CheckTicketEditFormState } from "@/lib/types/checkTicketEdit"
import { expandDbDevicesToFormRows, newEmptyDeviceRow } from "@/lib/utils/expandDeviceRows"

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

export type LoadCheckTicketEditStateOk = {
  ok: true
  ticketNumber: number
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

    const expanded = expandDbDevicesToFormRows(devices)
    const deviceRows = expanded.length > 0 ? expanded : [newEmptyDeviceRow()]

    const form: CheckTicketEditFormState = {
      patronName: String(ticket.patron_name ?? ""),
      mobile: String(ticket.mobile ?? ""),
      email: String(ticket.email ?? ""),
      devices: deviceRows,
    }

    return {
      ok: true,
      ticketNumber: num,
      form,
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to load ticket.",
    }
  }
}
