import { supabase, isSupabaseConfigured } from "@/lib/db/supabase"
import { db, ensurePowerSyncInitialized } from "@/lib/db/powersync"
import { TICKET_STATUS_COMPLETED } from "@/lib/constants/ticketStatus"
import type { ExportRow } from "@/lib/types/csvExport"

type ExportDataSource = "supabase" | "powersync"

interface TicketCore {
  id: string
  ticket_number: number | string | null
  patron_name: string | null
  mobile: string | null
  status: string | null
}

interface DeviceRow {
  ticket_id: string | null
  device_type: string | null
  quantity: number | string | null
  colour: string | null
}

interface NoteRow {
  ticket_id: string | null
  content: string | null
  recorded_at: number | string | null
}

interface PickupRow {
  ticket_id: string | null
  picked_up_at: number | string | null
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function unixSecondsToIso(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null
  return new Date(Math.floor(seconds) * 1000).toISOString()
}

function sortDevicesForExport(
  rows: { device_type: string | null; quantity: number | string | null; colour: string | null }[]
): typeof rows {
  return [...rows].sort((a, b) => {
    const da = String(a.device_type ?? "").localeCompare(String(b.device_type ?? ""))
    if (da !== 0) return da
    return String(a.colour ?? "").localeCompare(String(b.colour ?? ""))
  })
}

function buildExportRows(
  eventName: string,
  tickets: TicketCore[],
  devices: DeviceRow[],
  notes: NoteRow[],
  pickups: PickupRow[]
): ExportRow[] {
  const devicesByTicket = new Map<string, DeviceRow[]>()
  for (const d of devices) {
    const tid = String(d.ticket_id ?? "")
    if (!tid) continue
    if (!devicesByTicket.has(tid)) devicesByTicket.set(tid, [])
    devicesByTicket.get(tid)!.push(d)
  }

  const notesByTicket = new Map<string, NoteRow[]>()
  for (const n of notes) {
    const tid = String(n.ticket_id ?? "")
    if (!tid) continue
    if (!notesByTicket.has(tid)) notesByTicket.set(tid, [])
    notesByTicket.get(tid)!.push(n)
  }

  const maxPickupByTicket = new Map<string, number>()
  for (const p of pickups) {
    const tid = String(p.ticket_id ?? "")
    if (!tid) continue
    const t = Math.max(0, asInt(p.picked_up_at))
    maxPickupByTicket.set(tid, Math.max(maxPickupByTicket.get(tid) ?? 0, t))
  }

  const displayEventName = eventName.trim() || "Unknown event"

  const rows: ExportRow[] = []

  for (const t of tickets) {
    const tid = String(t.id ?? "")
    if (!tid) continue

    const ticketNotes = (notesByTicket.get(tid) ?? []).slice()
    ticketNotes.sort((a, b) => asInt(a.recorded_at) - asInt(b.recorded_at))

    const notesJoined = ticketNotes
      .map((n) => String(n.content ?? "").trim())
      .filter(Boolean)
      .join(" | ")

    const earliestNote = ticketNotes.length > 0 ? asInt(ticketNotes[0].recorded_at) : null
    const checkInTime = earliestNote != null && earliestNote > 0 ? unixSecondsToIso(earliestNote) : null

    const statusRaw = String(t.status ?? "")
    const isCompleted = statusRaw === TICKET_STATUS_COMPLETED
    const maxPickup = maxPickupByTicket.get(tid)
    const checkOutTime =
      isCompleted && maxPickup != null && maxPickup > 0 ? unixSecondsToIso(maxPickup) : null

    const devs = sortDevicesForExport(devicesByTicket.get(tid) ?? [])
    const deviceTypes = devs.map((d) => String(d.device_type ?? "").trim() || "Other").join(", ")
    const deviceQuantities = devs.map((d) => String(Math.max(0, asInt(d.quantity)))).join(", ")
    const deviceColours = devs.map((d) => String(d.colour ?? "").trim() || "Other").join(", ")

    rows.push({
      eventName: displayEventName,
      ticketNumber: Math.max(0, asInt(t.ticket_number)),
      patronName: String(t.patron_name ?? "").trim(),
      patronPhone: String(t.mobile ?? "").trim(),
      checkInTime,
      checkOutTime,
      deviceTypes,
      deviceQuantities,
      deviceColours,
      notes: notesJoined,
      status: isCompleted ? "Checked Out" : "Checked In",
    })
  }

  rows.sort((a, b) => {
    const ta = a.checkInTime != null ? Date.parse(a.checkInTime) : NaN
    const tb = b.checkInTime != null ? Date.parse(b.checkInTime) : NaN
    const aValid = Number.isFinite(ta)
    const bValid = Number.isFinite(tb)
    if (aValid && bValid && ta !== tb) return ta - tb
    if (aValid && !bValid) return -1
    if (!aValid && bValid) return 1
    return a.ticketNumber - b.ticketNumber
  })

  return rows
}

async function fetchExportDataFromSupabase(eventId: string): Promise<ExportRow[]> {
  const { data: evRow, error: evError } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .maybeSingle()
  if (evError) {
    throw new Error(evError.message)
  }
  const eventName = String(evRow?.name ?? "").trim()

  const { data: ticketRows, error: tError } = await supabase
    .from("tickets")
    .select("id, ticket_number, patron_name, mobile, status")
    .eq("event_id", eventId)
    .is("deleted_at", null)

  if (tError) {
    throw new Error(tError.message)
  }

  const list = (ticketRows ?? []) as TicketCore[]
  if (list.length === 0) {
    return []
  }

  const ticketIds = list.map((t) => t.id)

  const { data: deviceRows, error: dError } = await supabase
    .from("devices")
    .select("ticket_id, device_type, quantity, colour")
    .in("ticket_id", ticketIds)
  if (dError) {
    throw new Error(dError.message)
  }

  const { data: noteRows, error: nError } = await supabase
    .from("notes")
    .select("ticket_id, content, recorded_at")
    .in("ticket_id", ticketIds)
    .order("recorded_at", { ascending: true })
  if (nError) {
    throw new Error(nError.message)
  }

  const { data: pickupRows, error: pError } = await supabase
    .from("pickup_events")
    .select("ticket_id, picked_up_at")
    .in("ticket_id", ticketIds)
  if (pError) {
    throw new Error(pError.message)
  }

  const devices = (deviceRows ?? []) as DeviceRow[]
  const notes = (noteRows ?? []) as NoteRow[]
  const pickups = (pickupRows ?? []) as PickupRow[]

  return buildExportRows(eventName, list, devices, notes, pickups)
}

async function fetchExportDataFromPowerSync(eventId: string): Promise<ExportRow[]> {
  await ensurePowerSyncInitialized()

  const ev = await db.getOptional<{ name: string | null }>(
    "SELECT name FROM events WHERE id = ? LIMIT 1",
    [eventId]
  )
  const eventName = String(ev?.name ?? "").trim()

  const tickets = await db.getAll<TicketCore>(
    `SELECT id, ticket_number, patron_name, mobile, status
     FROM tickets
     WHERE event_id = ? AND deleted_at IS NULL`,
    [eventId]
  )

  if (tickets.length === 0) {
    return []
  }

  const placeholders = tickets.map(() => "?").join(", ")
  const ticketIds = tickets.map((t) => t.id)

  const devices = await db.getAll<DeviceRow>(
    `SELECT ticket_id, device_type, quantity, colour
     FROM devices
     WHERE ticket_id IN (${placeholders})
     ORDER BY ticket_id, device_type`,
    ticketIds
  )

  const notes = await db.getAll<NoteRow>(
    `SELECT ticket_id, content, recorded_at
     FROM notes
     WHERE ticket_id IN (${placeholders})
     ORDER BY ticket_id, recorded_at ASC`,
    ticketIds
  )

  const pickups = await db.getAll<PickupRow>(
    `SELECT ticket_id, picked_up_at
     FROM pickup_events
     WHERE ticket_id IN (${placeholders})`,
    ticketIds
  )

  return buildExportRows(eventName, tickets, devices, notes, pickups)
}

function logExportSource(source: ExportDataSource): void {
  console.info(`[BikePark] CSV export data source: ${source}`)
}

/**
 * Loads ticket data for CSV export: tries Supabase first, then the local PowerSync cache.
 * Check-in time is the earliest note `recorded_at` when notes exist; check-out uses the latest
 * `pickup_events.picked_up_at` when the ticket status is completed (schema has no `checked_in_at`).
 */
export async function fetchExportData(eventId: string): Promise<ExportRow[]> {
  if (!isSupabaseConfigured()) {
    const rows = await fetchExportDataFromPowerSync(eventId)
    logExportSource("powersync")
    return rows
  }

  try {
    const rows = await fetchExportDataFromSupabase(eventId)
    logExportSource("supabase")
    return rows
  } catch {
    // Supabase unreachable or query failed — use local PowerSync cache.
    const rows = await fetchExportDataFromPowerSync(eventId)
    logExportSource("powersync")
    return rows
  }
}
