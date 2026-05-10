"use client"

import * as React from "react"

import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import { db } from "@/lib/db/powersync"
import type { PickupTypeRemaining } from "@/lib/types/pickup"

export interface UsePickupTicketPickupDetailResult {
  lines: PickupTypeRemaining[]
  ticketDevicesRemaining: number
  isLoading: boolean
  error: string | null
}

interface DeviceRow {
  device_type: string | null
  quantity: number | string | null
}

interface PickedRow {
  device_type: string | null
  qty: number | string | null
}

interface TicketRow {
  devices_remaining: number | string | null
}

const DEVICES_SQL = `
  SELECT device_type, quantity
  FROM devices
  WHERE ticket_id = ?
`

const PICKED_SQL = `
  SELECT ped.device_type AS device_type, SUM(ped.quantity) AS qty
  FROM pickup_event_devices ped
  INNER JOIN pickup_events pe ON pe.id = ped.pickup_event_id
  WHERE pe.ticket_id = ?
  GROUP BY ped.device_type
`

const TICKET_SQL = `
  SELECT devices_remaining
  FROM tickets
  WHERE id = ?
    AND deleted_at IS NULL
  LIMIT 1
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function aggregateDevices(rows: DeviceRow[]): Record<string, number> {
  const map = new Map<string, number>()
  for (const r of rows) {
    const dt = String(r.device_type ?? "Other").trim() || "Other"
    const q = Math.max(0, asInt(r.quantity))
    map.set(dt, (map.get(dt) ?? 0) + q)
  }
  return Object.fromEntries(map)
}

function aggregatePicked(rows: PickedRow[]): Record<string, number> {
  const map = new Map<string, number>()
  for (const r of rows) {
    const dt = String(r.device_type ?? "Other").trim() || "Other"
    const q = Math.max(0, asInt(r.qty))
    map.set(dt, (map.get(dt) ?? 0) + q)
  }
  return Object.fromEntries(map)
}

function sortIndex(deviceType: string): number {
  const idx = (DEVICE_CATEGORIES as readonly string[]).indexOf(deviceType)
  return idx >= 0 ? idx : DEVICE_CATEGORIES.length
}

function buildLines(
  devices: Record<string, number>,
  picked: Record<string, number>
): PickupTypeRemaining[] {
  const types = new Set([...Object.keys(devices), ...Object.keys(picked)])
  const lines: PickupTypeRemaining[] = []
  for (const deviceType of types) {
    const dropped = devices[deviceType] ?? 0
    const pickedPreviously = picked[deviceType] ?? 0
    const remaining = Math.max(0, dropped - pickedPreviously)
    lines.push({ deviceType, dropped, pickedPreviously, remaining })
  }
  return lines.sort((a, b) => {
    const d = sortIndex(a.deviceType) - sortIndex(b.deviceType)
    if (d !== 0) return d
    return a.deviceType.localeCompare(b.deviceType)
  })
}

type DetailState = {
  devices: Record<string, number> | null
  picked: Record<string, number> | null
  devicesRemaining: number | null
  queryError: string | null
}

const initialDetailState: DetailState = {
  devices: null,
  picked: null,
  devicesRemaining: null,
  queryError: null,
}

type DetailAction =
  | { type: "reset" }
  | { type: "devices"; payload: Record<string, number> }
  | { type: "picked"; payload: Record<string, number> }
  | { type: "ticket"; payload: number }
  | { type: "ticketMissing" }
  | { type: "watchError"; payload: string }

function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case "reset":
      return initialDetailState
    case "devices":
      return { ...state, devices: action.payload, queryError: null }
    case "picked":
      return { ...state, picked: action.payload, queryError: null }
    case "ticket":
      return { ...state, devicesRemaining: action.payload, queryError: null }
    case "ticketMissing":
      return { ...state, queryError: "Ticket not found." }
    case "watchError":
      return { ...state, queryError: action.payload }
  }
}

export function usePickupTicketPickupDetail(
  ticketId: string | null,
  enabled: boolean
): UsePickupTicketPickupDetailResult {
  const [state, dispatch] = React.useReducer(detailReducer, initialDetailState)

  React.useEffect(() => {
    // Sync subscription lifecycle when the watched ticket changes (external DB watches).
    dispatch({ type: "reset" })

    if (!enabled || !ticketId) {
      return
    }

    const ac = new AbortController()

    db.watch(
      DEVICES_SQL,
      [ticketId],
      {
        onResult: (qr) => {
          const raw = (qr.rows?._array ?? []) as unknown[]
          const rows = raw.map((r) => r as DeviceRow)
          dispatch({ type: "devices", payload: aggregateDevices(rows) })
        },
        onError: (e) => {
          dispatch({ type: "watchError", payload: e.message })
        },
      },
      { signal: ac.signal }
    )

    db.watch(
      PICKED_SQL,
      [ticketId],
      {
        onResult: (qr) => {
          const raw = (qr.rows?._array ?? []) as unknown[]
          const rows = raw.map((r) => r as PickedRow)
          dispatch({ type: "picked", payload: aggregatePicked(rows) })
        },
        onError: (e) => {
          dispatch({ type: "watchError", payload: e.message })
        },
      },
      { signal: ac.signal }
    )

    db.watch(
      TICKET_SQL,
      [ticketId],
      {
        onResult: (qr) => {
          const raw = (qr.rows?._array ?? []) as unknown[]
          const row = raw[0] as TicketRow | undefined
          if (!row) {
            dispatch({ type: "ticketMissing" })
            return
          }
          dispatch({ type: "ticket", payload: Math.max(0, asInt(row.devices_remaining)) })
        },
        onError: (e) => {
          dispatch({ type: "watchError", payload: e.message })
        },
      },
      { signal: ac.signal }
    )

    return () => ac.abort()
  }, [enabled, ticketId])

  const lines = React.useMemo(() => {
    if (state.devices === null || state.picked === null) return []
    return buildLines(state.devices, state.picked)
  }, [state.devices, state.picked])

  const ticketDevicesRemaining = state.devicesRemaining ?? 0

  const isLoading =
    Boolean(enabled && ticketId) &&
    (state.devices === null || state.picked === null || state.devicesRemaining === null)

  return {
    lines,
    ticketDevicesRemaining,
    isLoading,
    error: state.queryError,
  }
}
