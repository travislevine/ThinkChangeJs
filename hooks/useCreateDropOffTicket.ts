"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import { db } from "@/lib/db/powersync"
import { getOrCreateDeviceUuid } from "@/lib/deviceUuid"
import type { DropOffBlankEntryFormState } from "@/lib/types/dropOffForm"

export interface CreateDropOffTicketResult {
  create: (state: DropOffBlankEntryFormState) => Promise<{ ticketId: string; ticketNumber: number }>
  isSubmitting: boolean
  error: string | null
}

function asInt(value: string): number {
  return Math.floor(Number(value))
}

function sumDevices(state: DropOffBlankEntryFormState): number {
  return state.devices.reduce((acc, d) => acc + (Number.isFinite(d.quantity) ? d.quantity : 0), 0)
}

export function useCreateDropOffTicket(): CreateDropOffTicketResult {
  const { currentEvent } = useEvent()
  const { success } = useToast()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const create = React.useCallback(
    async (state: DropOffBlankEntryFormState): Promise<{ ticketId: string; ticketNumber: number }> => {
      if (!currentEvent) {
        throw new Error("No active event.")
      }

      const ticketNumber = asInt(state.ticketNumber.trim())
      if (!Number.isFinite(ticketNumber)) {
        throw new Error("Ticket number is invalid.")
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const now = Math.floor(Date.now() / 1000)
        const ticketId = crypto.randomUUID()
        const deviceId = getOrCreateDeviceUuid()
        const totalDevices = sumDevices(state)

        await db.writeTransaction(async (tx) => {
          const pool = await tx.getOptional<{ id: string; status: string }>(
            "SELECT id, status FROM ticket_numbers WHERE event_id = ? AND number = ? LIMIT 1",
            [currentEvent.id, ticketNumber]
          )

          if (!pool?.id) {
            throw new Error("Ticket number not found in pool.")
          }
          if (pool.status === "in_use") {
            throw new Error(`Ticket #${ticketNumber} is already in use.`)
          }

          await tx.execute("UPDATE ticket_numbers SET status = 'in_use' WHERE id = ?", [pool.id])

          await tx.execute(
            "INSERT INTO tickets (id, event_id, ticket_number, patron_name, mobile, email, total_devices, devices_remaining, status, deleted_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)",
            [
              ticketId,
              currentEvent.id,
              ticketNumber,
              state.patronName.trim() ? state.patronName.trim() : null,
              state.mobile.trim() ? state.mobile.trim() : null,
              state.email.trim() ? state.email.trim() : null,
              totalDevices,
              totalDevices,
              "checked_in",
              deviceId || null,
            ]
          )

          for (const row of state.devices) {
            await tx.execute(
              "INSERT INTO devices (id, ticket_id, device_type, quantity, colour) VALUES (?, ?, ?, ?, ?)",
              [crypto.randomUUID(), ticketId, row.deviceType, row.quantity, row.colour]
            )
          }

          const note = state.notes.trim()
          if (note) {
            await tx.execute(
              "INSERT INTO notes (id, ticket_id, content, recorded_at) VALUES (?, ?, ?, ?)",
              [crypto.randomUUID(), ticketId, note, now]
            )
          }
        })

        success(`✓ Ticket #${String(ticketNumber).padStart(3, "0")} confirmed`)
        return { ticketId, ticketNumber }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to save."
        setError(message)
        throw e
      } finally {
        setIsSubmitting(false)
      }
    },
    [currentEvent, success]
  )

  return { create, isSubmitting, error }
}

