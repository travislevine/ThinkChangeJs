"use client"

import * as React from "react"

import { db } from "@/lib/db/powersync"
import { TICKET_STATUS_CHECKED_IN, TICKET_STATUS_COMPLETED } from "@/lib/constants/ticketStatus"

export interface CompletePickupParams {
  eventId: string
  ticketId: string
  ticketNumber: number
  picksByType: Record<string, number>
}

export interface CompletePickupOk {
  newRemaining: number
  totalPickedThisEvent: number
  pickedUpAt: number
}

export interface UseCompletePickupResult {
  complete: (params: CompletePickupParams) => Promise<CompletePickupOk>
  isSubmitting: boolean
}

interface DeviceAggRow {
  device_type: string | null
  q: number | string | null
}

interface PickedAggRow {
  device_type: string | null
  q: number | string | null
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function sumValues(r: Record<string, number>): number {
  let s = 0
  for (const v of Object.values(r)) {
    s += v
  }
  return s
}

export function useCompletePickup(): UseCompletePickupResult {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const complete = React.useCallback(async (params: CompletePickupParams): Promise<CompletePickupOk> => {
    const { eventId, ticketId, ticketNumber, picksByType } = params

    setIsSubmitting(true)
    try {
      const cleaned: Record<string, number> = {}
      for (const [k, v] of Object.entries(picksByType)) {
        const n = Math.max(0, Math.floor(Number(v)))
        if (!Number.isFinite(n)) continue
        if (n > 0) cleaned[k] = n
      }

      const totalPickIntent = sumValues(cleaned)
      if (totalPickIntent <= 0) {
        throw new Error("Select at least one device to pick up.")
      }

      const result = await db.writeTransaction(async (tx) => {
        const ticket = await tx.getOptional<{
          id: string
          event_id: string
          devices_remaining: number | string | null
          status: string | null
        }>(
          "SELECT id, event_id, devices_remaining, status FROM tickets WHERE id = ? AND deleted_at IS NULL LIMIT 1",
          [ticketId]
        )

        if (!ticket) {
          throw new Error("Ticket not found.")
        }
        if (ticket.event_id !== eventId) {
          throw new Error("Ticket does not belong to this event.")
        }
        if (String(ticket.status ?? "") !== TICKET_STATUS_CHECKED_IN) {
          throw new Error("This ticket is not active for pick-up.")
        }

        const devicesRemainingBefore = Math.max(0, asInt(ticket.devices_remaining))
        if (devicesRemainingBefore <= 0) {
          throw new Error("No devices remaining on this ticket.")
        }

        const deviceRows = await tx.getAll<DeviceAggRow>(
          "SELECT device_type, SUM(quantity) AS q FROM devices WHERE ticket_id = ? GROUP BY device_type",
          [ticketId]
        )
        const dropped: Record<string, number> = {}
        for (const r of deviceRows) {
          const dt = String(r.device_type ?? "Other").trim() || "Other"
          dropped[dt] = Math.max(0, asInt(r.q))
        }

        const pickedRows = await tx.getAll<PickedAggRow>(
          `SELECT ped.device_type AS device_type, SUM(ped.quantity) AS q
           FROM pickup_event_devices ped
           INNER JOIN pickup_events pe ON pe.id = ped.pickup_event_id
           WHERE pe.ticket_id = ?
           GROUP BY ped.device_type`,
          [ticketId]
        )
        const picked: Record<string, number> = {}
        for (const r of pickedRows) {
          const dt = String(r.device_type ?? "Other").trim() || "Other"
          picked[dt] = Math.max(0, asInt(r.q))
        }

        const types = new Set([...Object.keys(dropped), ...Object.keys(picked)])
        const remainingByType: Record<string, number> = {}
        for (const dt of types) {
          const rem = Math.max(0, (dropped[dt] ?? 0) - (picked[dt] ?? 0))
          remainingByType[dt] = rem
        }

        for (const [dt, qty] of Object.entries(cleaned)) {
          const maxForType = remainingByType[dt] ?? 0
          if (qty > maxForType) {
            throw new Error(`Cannot pick up more ${dt} than are still on hand.`)
          }
        }

        const totalPick = sumValues(cleaned)
        if (totalPick > devicesRemainingBefore) {
          throw new Error("Total pick-up exceeds devices remaining on this ticket.")
        }

        const now = Math.floor(Date.now() / 1000)
        const pickupEventId = crypto.randomUUID()

        await tx.execute(
          "INSERT INTO pickup_events (id, ticket_id, devices_picked_up, picked_up_at) VALUES (?, ?, ?, ?)",
          [pickupEventId, ticketId, totalPick, now]
        )

        for (const [deviceType, quantity] of Object.entries(cleaned)) {
          await tx.execute(
            "INSERT INTO pickup_event_devices (id, pickup_event_id, device_type, quantity) VALUES (?, ?, ?, ?)",
            [crypto.randomUUID(), pickupEventId, deviceType, quantity]
          )
        }

        const newRemaining = devicesRemainingBefore - totalPick

        if (newRemaining === 0) {
          await tx.execute(
            "UPDATE tickets SET devices_remaining = 0, status = ? WHERE id = ?",
            [TICKET_STATUS_COMPLETED, ticketId]
          )

          const pool = await tx.getOptional<{ id: string }>(
            "SELECT id FROM ticket_numbers WHERE event_id = ? AND number = ? LIMIT 1",
            [eventId, ticketNumber]
          )
          if (pool?.id) {
            await tx.execute("UPDATE ticket_numbers SET status = 'available' WHERE id = ?", [pool.id])
          }
        } else {
          await tx.execute("UPDATE tickets SET devices_remaining = ? WHERE id = ?", [
            newRemaining,
            ticketId,
          ])
        }

        return { newRemaining, totalPickedThisEvent: totalPick, pickedUpAt: now }
      })

      return result
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return { complete, isSubmitting }
}
