"use client"

import * as React from "react"

import { db } from "@/lib/db/powersync"
import type { ArchivedEventSnapshot, EventSummary, StartNewEventParams } from "@/lib/types/event"

const ACTIVE_EVENT_SQL =
  "SELECT id, name, started_at FROM events WHERE is_active = 1 ORDER BY started_at DESC LIMIT 1"

export interface EventContextValue {
  currentEvent: EventSummary | null
  startNewEvent: (params?: Partial<StartNewEventParams>) => Promise<void>
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

  const startNewEvent = React.useCallback(
    async (params?: Partial<StartNewEventParams>): Promise<void> => {
      const now = Math.floor(Date.now() / 1000)
      const label = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
      const name = (params?.name?.trim() ? params.name.trim() : `Event – ${label}`)
      const startedAt = params?.startedAt ?? now
      const endedAt = params?.endedAt ?? null

      await db.writeTransaction(async (tx) => {
        const previousEvent = await tx.getOptional<{
          id: string
          name: string
          started_at: number
          ended_at: number | null
        }>("SELECT id, name, started_at, ended_at FROM events WHERE is_active = 1 LIMIT 1")

        if (previousEvent) {
          const tickets = await tx.getAll<ArchivedEventSnapshot["tickets"][number]>(
            "SELECT id, event_id, ticket_number, patron_name, mobile, email, total_devices, devices_remaining, status, deleted_at, device_id FROM tickets WHERE event_id = ?",
            [previousEvent.id]
          )
          const ticketIds = tickets.map((t) => t.id).filter((id) => id.length > 0)

          const ticketIdPlaceholders = ticketIds.map(() => "?").join(", ")
          const devices =
            ticketIds.length > 0
              ? await tx.getAll<ArchivedEventSnapshot["devices"][number]>(
                  `SELECT id, ticket_id, device_type, quantity, colour FROM devices WHERE ticket_id IN (${ticketIdPlaceholders})`,
                  ticketIds
                )
              : []

          const notes =
            ticketIds.length > 0
              ? await tx.getAll<ArchivedEventSnapshot["notes"][number]>(
                  `SELECT id, ticket_id, content, recorded_at FROM notes WHERE ticket_id IN (${ticketIdPlaceholders})`,
                  ticketIds
                )
              : []

          const pickupEvents =
            ticketIds.length > 0
              ? await tx.getAll<ArchivedEventSnapshot["pickup_events"][number]>(
                  `SELECT id, ticket_id, devices_picked_up, picked_up_at FROM pickup_events WHERE ticket_id IN (${ticketIdPlaceholders})`,
                  ticketIds
                )
              : []

          const pickupEventIds = pickupEvents.map((p) => p.id).filter((id) => id.length > 0)
          const pickupEventPlaceholders = pickupEventIds.map(() => "?").join(", ")
          const pickupEventDevices =
            pickupEventIds.length > 0
              ? await tx.getAll<ArchivedEventSnapshot["pickup_event_devices"][number]>(
                  `SELECT id, pickup_event_id, device_type, quantity FROM pickup_event_devices WHERE pickup_event_id IN (${pickupEventPlaceholders})`,
                  pickupEventIds
                )
              : []

          const ticketNumbers = await tx.getAll<ArchivedEventSnapshot["ticket_numbers"][number]>(
            "SELECT id, number, status, event_id FROM ticket_numbers WHERE event_id = ?",
            [previousEvent.id]
          )

          const snapshot: ArchivedEventSnapshot = {
            event: previousEvent,
            ticket_numbers: ticketNumbers,
            tickets,
            devices,
            pickup_events: pickupEvents,
            pickup_event_devices: pickupEventDevices,
            notes,
          }

          const archivedAt = now
          await tx.execute(
            "INSERT INTO archived_events (id, event_id, snapshot_json, archived_at) VALUES (?, ?, ?, ?)",
            [crypto.randomUUID(), previousEvent.id, JSON.stringify(snapshot), archivedAt]
          )

          await tx.execute("UPDATE events SET is_active = 0, ended_at = ? WHERE id = ?", [
            now,
            previousEvent.id,
          ])
        }

        const pool = await tx.getOptional<{ event_id: string }>("SELECT event_id FROM ticket_numbers LIMIT 1")

        const id = crypto.randomUUID()
        await tx.execute(
          "INSERT INTO events (id, name, started_at, ended_at, is_active) VALUES (?, ?, ?, ?, 1)",
          [id, name, startedAt, endedAt]
        )

        if (pool?.event_id) {
          await tx.execute(
            "UPDATE ticket_numbers SET event_id = ?, status = 'available' WHERE event_id = ?",
            [id, pool.event_id]
          )
        } else {
          await tx.execute("UPDATE ticket_numbers SET event_id = ?, status = 'available'", [id])
        }
      })
    },
    []
  )

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

EventProvider.displayName = "EventProvider"

export function useEvent(): EventContextValue {
  const ctx = React.useContext(EventContext)
  if (!ctx) {
    throw new Error("useEvent must be used within EventProvider")
  }
  return ctx
}
