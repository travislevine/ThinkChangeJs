"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { CHECK_TICKET_SORT_MODE } from "@/lib/constants/checkTicket"
import type { CheckTicketSortMode } from "@/lib/constants/checkTicket"
import { db } from "@/lib/db/powersync"
import type { CheckTicketTicketRow } from "@/lib/types/checkTicket"

export interface UseCheckTicketTicketsResult {
  tickets: CheckTicketTicketRow[]
  isLoading: boolean
  error: string | null
}

interface TicketWatchRow {
  id: string
  ticket_number: number | string | null
  patron_name: string | null
  mobile: string | null
  email: string | null
  total_devices: number | string | null
  devices_remaining: number | string | null
  status: string | null
}

interface CheckTicketTicketsState {
  key: string | null
  rows: CheckTicketTicketRow[]
  error: string | null
}

const CHECK_TICKET_SQL = `
  SELECT id,
         ticket_number,
         patron_name,
         mobile,
         email,
         total_devices,
         devices_remaining,
         status
  FROM tickets
  WHERE event_id = ?
    AND deleted_at IS NULL
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function rowToRow(r: TicketWatchRow): CheckTicketTicketRow {
  return {
    ticketId: r.id,
    ticketNumber: asInt(r.ticket_number),
    patronName: String(r.patron_name ?? "").trim() || "Anonymous",
    mobile: r.mobile ? String(r.mobile).trim() : null,
    email: r.email ? String(r.email).trim() : null,
    totalDevices: Math.max(0, asInt(r.total_devices)),
    devicesRemaining: Math.max(0, asInt(r.devices_remaining)),
    status: String(r.status ?? ""),
  }
}

function matchesSearch(t: CheckTicketTicketRow, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  const ticketStr = String(t.ticketNumber)
  const name = t.patronName.toLowerCase()
  const mobile = (t.mobile ?? "").toLowerCase()
  const email = (t.email ?? "").toLowerCase()
  return (
    ticketStr.includes(needle) ||
    name.includes(needle) ||
    mobile.includes(needle) ||
    email.includes(needle)
  )
}

function sortTickets(rows: CheckTicketTicketRow[], mode: CheckTicketSortMode): CheckTicketTicketRow[] {
  const copy = [...rows]
  if (mode === CHECK_TICKET_SORT_MODE.NEWEST_FIRST) {
    copy.sort((a, b) => {
      if (b.ticketNumber !== a.ticketNumber) return b.ticketNumber - a.ticketNumber
      return b.ticketId.localeCompare(a.ticketId)
    })
  } else {
    copy.sort((a, b) => {
      if (a.ticketNumber !== b.ticketNumber) return a.ticketNumber - b.ticketNumber
      return b.ticketId.localeCompare(a.ticketId)
    })
  }
  return copy
}

export function useCheckTicketTickets(
  searchQuery: string,
  sortMode: CheckTicketSortMode
): UseCheckTicketTicketsResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const key = eventId ? `event:${eventId}` : null
  const q = searchQuery.trim().toLowerCase()

  const [state, setState] = React.useState<CheckTicketTicketsState>({
    key: null,
    rows: [],
    error: null,
  })

  React.useEffect(() => {
    const ac = new AbortController()

    if (eventId) {
      db.watch(
        CHECK_TICKET_SQL,
        [eventId],
        {
          onResult: (qr) => {
            const raw = (qr.rows?._array ?? []) as unknown[]
            const rows = raw.map((r) => rowToRow(r as TicketWatchRow))
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

  const tickets = React.useMemo(() => {
    const filtered = state.rows.filter((t) => matchesSearch(t, q))
    return sortTickets(filtered, sortMode)
  }, [q, sortMode, state.rows])

  const stale = state.key !== key
  return {
    tickets,
    isLoading: Boolean(eventId) && stale,
    error: stale ? null : state.error,
  }
}
