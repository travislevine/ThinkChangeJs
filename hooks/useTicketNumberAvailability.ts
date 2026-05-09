"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"

export interface TicketNumberAvailabilityResult {
  inUse: boolean
  isLoading: boolean
  error: string | null
}

interface TicketAvailabilityState {
  key: string | null
  inUse: boolean
  error: string | null
}

const TICKET_IN_USE_SQL =
  "SELECT status FROM ticket_numbers WHERE event_id = ? AND number = ? LIMIT 1"

export function useTicketNumberAvailability(ticketNumber: number | null): TicketNumberAvailabilityResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const key = eventId && ticketNumber ? `${eventId}:${ticketNumber}` : null

  const [state, setState] = React.useState<TicketAvailabilityState>({
    key: null,
    inUse: false,
    error: null,
  })

  React.useEffect(() => {
    const ac = new AbortController()

    if (eventId && ticketNumber) {
      db.watch(
        TICKET_IN_USE_SQL,
        [eventId, ticketNumber],
        {
          onResult: (qr) => {
            const row = qr.rows?.item(0) as { status?: unknown } | undefined
            const status = String(row?.status ?? "")
            setState({ key: `${eventId}:${ticketNumber}`, inUse: status === "in_use", error: null })
          },
          onError: (e) => {
            setState({ key: `${eventId}:${ticketNumber}`, inUse: false, error: e.message })
          },
        },
        { signal: ac.signal }
      )
    }

    return () => ac.abort()
  }, [eventId, ticketNumber])

  if (!eventId || !ticketNumber) {
    return { inUse: false, isLoading: false, error: null }
  }

  const stale = state.key !== key
  return {
    inUse: stale ? false : state.inUse,
    error: stale ? null : state.error,
    isLoading: stale,
  }
}

