"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"
import { TICKET_STATUS_CHECKED_IN, TICKET_STATUS_COMPLETED } from "@/lib/constants/ticketStatus"
import type { PickupTicketSummary } from "@/lib/types/pickup"

export interface UsePickupTicketsResult {
  activeTickets: PickupTicketSummary[]
  completedTickets: PickupTicketSummary[]
  isLoading: boolean
  error: string | null
}

interface TicketWatchRow {
  id: string
  ticket_number: number | string | null
  patron_name: string | null
  mobile: string | null
  devices_remaining: number | string | null
  status: string | null
}

interface PickupTicketsState {
  key: string | null
  rows: PickupTicketSummary[]
  error: string | null
}

const PICKUP_TICKETS_SQL = `
  SELECT id, ticket_number, patron_name, mobile, devices_remaining, status
  FROM tickets
  WHERE event_id = ?
    AND deleted_at IS NULL
    AND status IN (?, ?)
  ORDER BY ticket_number ASC
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function rowToSummary(r: TicketWatchRow): PickupTicketSummary {
  return {
    ticketId: r.id,
    ticketNumber: asInt(r.ticket_number),
    patronName: String(r.patron_name ?? "").trim() || "Anonymous",
    mobile: r.mobile ? String(r.mobile).trim() : null,
    devicesRemaining: asInt(r.devices_remaining),
    status: String(r.status ?? ""),
  }
}

function matchesSearch(t: PickupTicketSummary, q: string): boolean {
  if (!q) return true
  const ticketStr = String(t.ticketNumber)
  const name = t.patronName.toLowerCase()
  const mobile = (t.mobile ?? "").toLowerCase()
  return ticketStr.includes(q) || name.includes(q) || mobile.includes(q)
}

export function usePickupTickets(searchQuery: string): UsePickupTicketsResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const key = eventId ? `event:${eventId}` : null
  const q = searchQuery.trim().toLowerCase()

  const [state, setState] = React.useState<PickupTicketsState>({
    key: null,
    rows: [],
    error: null,
  })

  React.useEffect(() => {
    const ac = new AbortController()

    if (eventId) {
      db.watch(
        PICKUP_TICKETS_SQL,
        [eventId, TICKET_STATUS_CHECKED_IN, TICKET_STATUS_COMPLETED],
        {
          onResult: (qr) => {
            const raw = (qr.rows?._array ?? []) as unknown[]
            const rows = raw
              .map((r) => r as TicketWatchRow)
              .map(rowToSummary)
            setState({ key: `event:${eventId}`, rows, error: null })
          },
          onError: (e) => {
            setState({ key: `event:${eventId}`, rows: [], error: e.message })
          },
        },
        { signal: ac.signal }
      )
    }

    return () => ac.abort()
  }, [eventId])

  const { activeTickets, completedTickets } = React.useMemo(() => {
    const activeAll = state.rows.filter(
      (t) => t.status === TICKET_STATUS_CHECKED_IN && t.devicesRemaining > 0
    )
    const completedAll = state.rows.filter((t) => t.status === TICKET_STATUS_COMPLETED)

    const activeTickets = activeAll.filter((t) => matchesSearch(t, q))
    const completedTickets = completedAll.filter((t) => matchesSearch(t, q))

    return { activeTickets, completedTickets }
  }, [q, state.rows])

  const stale = state.key !== key
  return {
    activeTickets,
    completedTickets,
    isLoading: Boolean(eventId) && stale,
    error: stale ? null : state.error,
  }
}
