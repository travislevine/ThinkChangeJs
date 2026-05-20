"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import {
  CHECK_TICKET_DEVICE_ADDED_NOTE_PREFIX,
  isCheckTicketDeviceAddedNote,
} from "@/lib/constants/checkTicketNotes"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import { db } from "@/lib/db/powersync"
import { parsePickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"
import type { CheckTicketNoteEntry, CheckTicketPickupEntry } from "@/lib/types/checkTicket"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

export interface UseCheckTicketRecordDetailsResult {
  notesByTicketId: Record<string, CheckTicketNoteEntry[]>
  pickupsByTicketId: Record<string, CheckTicketPickupEntry[]>
  isLoading: boolean
}

interface NoteRow {
  id: string
  ticket_id: string
  content: string | null
  recorded_at: number | string | null
}

interface PickupFlatRow {
  pickup_event_id: string
  ticket_id: string
  picked_up_at: number | string | null
  devices_picked_up: number | string | null
  device_type: string | null
  quantity: number | string | null
}

const NOTES_SQL = `
  SELECT n.id AS id,
         n.ticket_id AS ticket_id,
         n.content AS content,
         n.recorded_at AS recorded_at
  FROM notes n
  INNER JOIN tickets t ON t.id = n.ticket_id
  WHERE t.event_id = ?
    AND t.deleted_at IS NULL
`

const PICKUPS_SQL = `
  SELECT pe.id AS pickup_event_id,
         pe.ticket_id AS ticket_id,
         pe.picked_up_at AS picked_up_at,
         pe.devices_picked_up AS devices_picked_up,
         ped.device_type AS device_type,
         ped.quantity AS quantity
  FROM pickup_events pe
  INNER JOIN tickets t ON t.id = pe.ticket_id
  LEFT JOIN pickup_event_devices ped ON ped.pickup_event_id = pe.id
  WHERE t.event_id = ?
    AND t.deleted_at IS NULL
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function sortDeviceLines(lines: PickupTicketDeviceLine[]): PickupTicketDeviceLine[] {
  const rank = (dt: string): number => {
    const idx = (DEVICE_CATEGORIES as readonly string[]).indexOf(dt)
    return idx >= 0 ? idx : DEVICE_CATEGORIES.length
  }
  return [...lines].sort((a, b) => {
    const d = rank(a.deviceType) - rank(b.deviceType)
    if (d !== 0) return d
    return a.deviceType.localeCompare(b.deviceType)
  })
}

function groupNotes(rows: NoteRow[]): Record<string, CheckTicketNoteEntry[]> {
  const map: Record<string, CheckTicketNoteEntry[]> = {}
  for (const r of rows) {
    const tid = String(r.ticket_id ?? "")
    if (!tid) continue
    const content = String(r.content ?? "").trim()
    if (isCheckTicketDeviceAddedNote(content)) {
      continue
    }
    if (!map[tid]) map[tid] = []
    map[tid].push({
      noteId: String(r.id ?? ""),
      content,
      recordedAtSeconds: Math.max(0, asInt(r.recorded_at)),
    })
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => b.recordedAtSeconds - a.recordedAtSeconds)
  }
  return map
}

function deviceAddedNotesToPickupEntries(rows: NoteRow[]): Record<string, CheckTicketPickupEntry[]> {
  const byTicket: Record<string, CheckTicketPickupEntry[]> = {}

  for (const r of rows) {
    const tid = String(r.ticket_id ?? "")
    const noteId = String(r.id ?? "")
    if (!tid || !noteId) continue

    const content = String(r.content ?? "").trim()
    if (!isCheckTicketDeviceAddedNote(content)) {
      continue
    }

    const breakdown = content.slice(CHECK_TICKET_DEVICE_ADDED_NOTE_PREFIX.length).trim()
    const deviceLines = parsePickupDeviceBreakdown(breakdown)
    if (deviceLines.length === 0) {
      continue
    }

    const devicesPickedUp = deviceLines.reduce((sum, line) => sum + line.quantity, 0)
    const item: CheckTicketPickupEntry = {
      pickupEventId: noteId,
      kind: "device_added",
      pickedUpAtSeconds: Math.max(0, asInt(r.recorded_at)),
      devicesPickedUp,
      deviceLines,
    }
    if (!byTicket[tid]) byTicket[tid] = []
    byTicket[tid].push(item)
  }

  return byTicket
}

function mergePickupHistories(
  pickups: Record<string, CheckTicketPickupEntry[]>,
  deviceAdds: Record<string, CheckTicketPickupEntry[]>
): Record<string, CheckTicketPickupEntry[]> {
  const merged: Record<string, CheckTicketPickupEntry[]> = { ...pickups }

  for (const [ticketId, adds] of Object.entries(deviceAdds)) {
    if (!merged[ticketId]) {
      merged[ticketId] = []
    }
    merged[ticketId].push(...adds)
  }

  for (const k of Object.keys(merged)) {
    merged[k].sort((a, b) => b.pickedUpAtSeconds - a.pickedUpAtSeconds)
  }

  return merged
}

function mergePickups(rows: PickupFlatRow[]): Record<string, CheckTicketPickupEntry[]> {
  const byPe = new Map<
    string,
    {
      ticketId: string
      pickedUpAtSeconds: number
      devicesPickedUp: number
      types: Map<string, number>
    }
  >()

  for (const r of rows) {
    const peId = String(r.pickup_event_id ?? "")
    const tid = String(r.ticket_id ?? "")
    if (!peId || !tid) continue

    if (!byPe.has(peId)) {
      byPe.set(peId, {
        ticketId: tid,
        pickedUpAtSeconds: Math.max(0, asInt(r.picked_up_at)),
        devicesPickedUp: Math.max(0, asInt(r.devices_picked_up)),
        types: new Map(),
      })
    }

    const entry = byPe.get(peId)!
    const dt = r.device_type != null ? String(r.device_type).trim() : ""
    if (dt) {
      const q = Math.max(0, asInt(r.quantity))
      entry.types.set(dt, (entry.types.get(dt) ?? 0) + q)
    }
  }

  const byTicket: Record<string, CheckTicketPickupEntry[]> = {}

  for (const [peId, v] of byPe) {
    const lines: PickupTicketDeviceLine[] = sortDeviceLines(
      Array.from(v.types.entries()).map(([deviceType, quantity]) => ({ deviceType, quantity }))
    )
    const item: CheckTicketPickupEntry = {
      pickupEventId: peId,
      kind: "pickup",
      pickedUpAtSeconds: v.pickedUpAtSeconds,
      devicesPickedUp: v.devicesPickedUp,
      deviceLines: lines,
    }
    if (!byTicket[v.ticketId]) byTicket[v.ticketId] = []
    byTicket[v.ticketId].push(item)
  }

  for (const k of Object.keys(byTicket)) {
    byTicket[k].sort((a, b) => b.pickedUpAtSeconds - a.pickedUpAtSeconds)
  }

  return byTicket
}

type DetailsState = {
  notes: Record<string, CheckTicketNoteEntry[]> | null
  pickups: Record<string, CheckTicketPickupEntry[]> | null
  noteRows: NoteRow[] | null
  dataKey: string | null
}

const initialDetails: DetailsState = {
  notes: null,
  pickups: null,
  noteRows: null,
  dataKey: null,
}

type DetailsAction =
  | { type: "reset" }
  | { type: "notes"; payload: Record<string, CheckTicketNoteEntry[]>; dataKey: string }
  | { type: "noteRows"; payload: NoteRow[]; dataKey: string }
  | { type: "pickups"; payload: Record<string, CheckTicketPickupEntry[]>; dataKey: string }

function detailsReducer(state: DetailsState, action: DetailsAction): DetailsState {
  switch (action.type) {
    case "reset":
      return initialDetails
    case "notes":
      return { ...state, notes: action.payload, dataKey: action.dataKey }
    case "noteRows":
      return { ...state, noteRows: action.payload, dataKey: action.dataKey }
    case "pickups":
      return { ...state, pickups: action.payload, dataKey: action.dataKey }
  }
}

export function useCheckTicketRecordDetails(): UseCheckTicketRecordDetailsResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const key = eventId ? `event:${eventId}` : null

  const [state, dispatch] = React.useReducer(detailsReducer, initialDetails)

  React.useEffect(() => {
    // Sync DB subscription lifecycle when the active event changes.
    dispatch({ type: "reset" })

    if (!eventId) {
      return
    }

    const ac = new AbortController()
    const dk = `event:${eventId}`

    db.watch(
      NOTES_SQL,
      [eventId],
      {
        onResult: (qr) => {
          const raw = (qr.rows?._array ?? []) as unknown[]
          const rows = raw.map((r) => r as NoteRow)
          dispatch({ type: "noteRows", payload: rows, dataKey: dk })
          dispatch({ type: "notes", payload: groupNotes(rows), dataKey: dk })
        },
        onError: () => {
          dispatch({ type: "noteRows", payload: [], dataKey: dk })
          dispatch({ type: "notes", payload: {}, dataKey: dk })
        },
      },
      { signal: ac.signal }
    )

    db.watch(
      PICKUPS_SQL,
      [eventId],
      {
        onResult: (qr) => {
          const raw = (qr.rows?._array ?? []) as unknown[]
          const rows = raw.map((r) => r as PickupFlatRow)
          dispatch({ type: "pickups", payload: mergePickups(rows), dataKey: dk })
        },
        onError: () => {
          dispatch({ type: "pickups", payload: {}, dataKey: dk })
        },
      },
      { signal: ac.signal }
    )

    return () => ac.abort()
  }, [eventId])

  const stale = state.dataKey !== key

  const notesByTicketId = stale ? {} : (state.notes ?? {})
  const pickupsByTicketId = React.useMemo(() => {
    if (stale || state.pickups === null || state.noteRows === null) {
      return {}
    }
    const deviceAdds = deviceAddedNotesToPickupEntries(state.noteRows)
    return mergePickupHistories(state.pickups, deviceAdds)
  }, [stale, state.noteRows, state.pickups])

  const isLoading =
    Boolean(eventId) &&
    (state.notes === null || state.pickups === null || state.noteRows === null || stale)

  return {
    notesByTicketId,
    pickupsByTicketId,
    isLoading,
  }
}
