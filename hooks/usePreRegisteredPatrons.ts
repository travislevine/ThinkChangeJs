"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"

export interface PreRegisteredPatron {
  ticketId: string
  ticketNumber: number
  patronName: string
  mobile: string | null
  email: string | null
}

export interface UsePreRegisteredPatronsResult {
  patrons: PreRegisteredPatron[]
  isLoading: boolean
  error: string | null
}

interface PreRegisteredState {
  key: string | null
  patrons: PreRegisteredPatron[]
  error: string | null
}

type PatronRow = {
  id: string
  ticket_number: number | string | null
  patron_name: string | null
  mobile: string | null
  email: string | null
}

const PRE_REGISTERED_SQL = `
  SELECT id, ticket_number, patron_name, mobile, email
  FROM tickets
  WHERE event_id = ?
    AND deleted_at IS NULL
    AND status = 'pre_registered'
  ORDER BY patron_name ASC
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

export function usePreRegisteredPatrons(query: string): UsePreRegisteredPatronsResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const key = eventId ? `event:${eventId}` : null
  const q = query.trim().toLowerCase()

  const [state, setState] = React.useState<PreRegisteredState>({
    key: null,
    patrons: [],
    error: null,
  })

  React.useEffect(() => {
    const ac = new AbortController()

    if (eventId) {
      db.watch(
        PRE_REGISTERED_SQL,
        [eventId],
        {
          onResult: (qr) => {
            const rows = (qr.rows?._array ?? []) as unknown[]
            const patrons: PreRegisteredPatron[] = rows
              .map((r) => r as PatronRow)
              .map((row) => ({
                ticketId: row.id,
                ticketNumber: asInt(row.ticket_number),
                patronName: String(row.patron_name ?? "").trim() || "Anonymous",
                mobile: row.mobile ? String(row.mobile) : null,
                email: row.email ? String(row.email) : null,
              }))

            setState({ key: `event:${eventId}`, patrons, error: null })
          },
          onError: (e) => {
            setState({ key: `event:${eventId}`, patrons: [], error: e.message })
          },
        },
        { signal: ac.signal }
      )
    }

    return () => ac.abort()
  }, [eventId])

  const filtered = React.useMemo(() => {
    if (state.key !== key) return []
    if (!q) return state.patrons
    return state.patrons.filter((p) => {
      const name = p.patronName.toLowerCase()
      const mobile = (p.mobile ?? "").toLowerCase()
      return name.includes(q) || mobile.includes(q)
    })
  }, [key, q, state.key, state.patrons])

  const stale = state.key !== key
  return {
    patrons: filtered,
    isLoading: Boolean(eventId) && stale,
    error: stale ? null : state.error,
  }
}

