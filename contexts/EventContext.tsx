"use client"

import * as React from "react"

import { db } from "@/lib/db/powersync"
import type { EventSummary } from "@/lib/types/event"

const ACTIVE_EVENT_SQL =
  "SELECT id, name, started_at FROM events WHERE is_active = 1 ORDER BY started_at DESC LIMIT 1"

export interface EventContextValue {
  currentEvent: EventSummary | null
  startNewEvent: () => Promise<void>
  closeCurrentEvent: () => Promise<void>
}

const EventContext = React.createContext<EventContextValue | null>(null)

function parseEventRow(row: Record<string, unknown> | undefined): EventSummary | null {
  if (!row || typeof row.id !== "string" || typeof row.name !== "string") {
    return null
  }
  const started = row.started_at
  const startedAt = typeof started === "number" ? started : Number(started)
  if (!Number.isFinite(startedAt)) {
    return null
  }
  return { id: row.id, name: row.name, startedAt }
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [currentEvent, setCurrentEvent] = React.useState<EventSummary | null>(null)

  React.useEffect(() => {
    const ac = new AbortController()
    db.watch(
      ACTIVE_EVENT_SQL,
      [],
      {
        onResult: (result) => {
          const row = result.rows?.item(0) as Record<string, unknown> | undefined
          setCurrentEvent(parseEventRow(row))
        },
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [])

  const closeCurrentEvent = React.useCallback(async (): Promise<void> => {
    const endedAt = Math.floor(Date.now() / 1000)
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        "UPDATE events SET is_active = 0, ended_at = ? WHERE is_active = 1",
        [endedAt]
      )
    })
  }, [])

  const startNewEvent = React.useCallback(async (): Promise<void> => {
    const now = Math.floor(Date.now() / 1000)
    const label = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())
    const name = `Event – ${label}`

    await db.writeTransaction(async (tx) => {
      await tx.execute("UPDATE events SET is_active = 0, ended_at = ? WHERE is_active = 1", [now])

      const pool = await tx.getOptional<{ event_id: string }>(
        "SELECT event_id FROM ticket_numbers LIMIT 1"
      )

      const id = crypto.randomUUID()
      await tx.execute(
        "INSERT INTO events (id, name, started_at, ended_at, is_active) VALUES (?, ?, ?, NULL, 1)",
        [id, name, now]
      )

      if (pool?.event_id) {
        await tx.execute(
          "UPDATE ticket_numbers SET event_id = ?, status = 'available' WHERE event_id = ?",
          [id, pool.event_id]
        )
      }
    })
  }, [])

  const value = React.useMemo<EventContextValue>(
    () => ({
      currentEvent,
      startNewEvent,
      closeCurrentEvent,
    }),
    [currentEvent, startNewEvent, closeCurrentEvent]
  )

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

export function useEvent(): EventContextValue {
  const ctx = React.useContext(EventContext)
  if (!ctx) {
    throw new Error("useEvent must be used within EventProvider")
  }
  return ctx
}
