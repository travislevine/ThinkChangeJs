"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

export interface UsePickupTicketDeviceLinesResult {
  linesByTicketId: Record<string, PickupTicketDeviceLine[]>
  isLoading: boolean
  error: string | null
}

interface DeviceWatchRow {
  ticket_id: string
  device_type: string | null
  quantity: number | string | null
}

interface DeviceLinesState {
  key: string | null
  linesByTicketId: Record<string, PickupTicketDeviceLine[]>
  error: string | null
}

const DEVICE_LINES_SQL = `
  SELECT d.ticket_id AS ticket_id, d.device_type AS device_type, d.quantity AS quantity
  FROM devices d
  INNER JOIN tickets t ON t.id = d.ticket_id
  WHERE t.event_id = ?
    AND t.deleted_at IS NULL
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function aggregateLines(rows: DeviceWatchRow[]): Record<string, PickupTicketDeviceLine[]> {
  const perTicket = new Map<string, Map<string, number>>()

  for (const r of rows) {
    const ticketId = String(r.ticket_id ?? "")
    if (!ticketId) continue
    const deviceType = String(r.device_type ?? "Other").trim() || "Other"
    const q = Math.max(0, asInt(r.quantity))

    let byType = perTicket.get(ticketId)
    if (!byType) {
      byType = new Map<string, number>()
      perTicket.set(ticketId, byType)
    }
    byType.set(deviceType, (byType.get(deviceType) ?? 0) + q)
  }

  const out: Record<string, PickupTicketDeviceLine[]> = {}
  for (const [ticketId, byType] of perTicket) {
    out[ticketId] = Array.from(byType.entries()).map(([deviceType, quantity]) => ({
      deviceType,
      quantity,
    }))
  }
  return out
}

export function usePickupTicketDeviceLines(): UsePickupTicketDeviceLinesResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const key = eventId ? `event:${eventId}` : null

  const [state, setState] = React.useState<DeviceLinesState>({
    key: null,
    linesByTicketId: {},
    error: null,
  })

  React.useEffect(() => {
    const ac = new AbortController()

    if (eventId) {
      db.watch(
        DEVICE_LINES_SQL,
        [eventId],
        {
          onResult: (qr) => {
            const raw = (qr.rows?._array ?? []) as unknown[]
            const rows = raw.map((r) => r as DeviceWatchRow)
            const linesByTicketId = aggregateLines(rows)
            setState({ key: `event:${eventId}`, linesByTicketId, error: null })
          },
          onError: (e) => {
            setState({ key: `event:${eventId}`, linesByTicketId: {}, error: e.message })
          },
        },
        { signal: ac.signal }
      )
    }

    return () => ac.abort()
  }, [eventId])

  const stale = state.key !== key
  return {
    linesByTicketId: stale ? {} : state.linesByTicketId,
    isLoading: Boolean(eventId) && stale,
    error: stale ? null : state.error,
  }
}
