"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import { db } from "@/lib/db/powersync"
import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import { TICKET_NUMBER_POOL_MAX, TICKET_NUMBER_POOL_MIN } from "@/lib/constants/ticketPool"
import type { DropOffBlankEntryFormState, DropOffDeviceRow } from "@/lib/types/dropOffForm"

type TicketRow = {
  id: string
  ticket_number: number | string | null
  patron_name: string | null
  mobile: string | null
  email: string | null
}

type DeviceRow = {
  id: string
  device_type: string | null
  quantity: number | string | null
  colour: string | null
}

type NoteRow = {
  content: string | null
}

export interface EditPreRegisteredState {
  open: boolean
  ticketId: string | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  form: DropOffBlankEntryFormState | null
}

export interface EditPreRegisteredActions {
  openFor: (ticketId: string) => void
  close: () => void
  onOpenChange: (open: boolean) => void
  setForm: React.Dispatch<React.SetStateAction<DropOffBlankEntryFormState | null>>
  save: () => Promise<void>
  remove: () => Promise<void>
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function toDeviceType(v: string | null): (typeof DEVICE_CATEGORIES)[number] {
  const s = String(v ?? "Other")
  if ((DEVICE_CATEGORIES as readonly string[]).includes(s)) {
    return s as (typeof DEVICE_CATEGORIES)[number]
  }
  return "Other"
}

function toColour(v: string | null): (typeof COLOURS)[number] {
  const s = String(v ?? "Other")
  if ((COLOURS as readonly string[]).includes(s)) {
    return s as (typeof COLOURS)[number]
  }
  return "Other"
}

function newDeviceRow(): DropOffDeviceRow {
  return {
    id: crypto.randomUUID(),
    deviceType: DEVICE_CATEGORIES[0],
    quantity: 1,
    colour: COLOURS[0],
  }
}

function validateTicketNumberRaw(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  const int = Math.floor(n)
  if (int < TICKET_NUMBER_POOL_MIN || int > TICKET_NUMBER_POOL_MAX) return null
  return int
}

export function useEditPreRegisteredPatron(): [EditPreRegisteredState, EditPreRegisteredActions] {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const { success, error: toastError } = useToast()

  const [open, setOpen] = React.useState(false)
  const [ticketId, setTicketId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<DropOffBlankEntryFormState | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const openFor = React.useCallback((id: string) => {
    setTicketId(id)
    setOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setOpen(false)
  }, [])

  const onOpenChange = React.useCallback((next: boolean) => {
    setOpen(next)
  }, [])

  React.useEffect(() => {
    if (!open || !ticketId || !eventId) return
    let cancelled = false

    void (async () => {
      try {
        const ticket = await db.getOptional<TicketRow>(
          "SELECT id, ticket_number, patron_name, mobile, email FROM tickets WHERE id = ? AND event_id = ? AND deleted_at IS NULL LIMIT 1",
          [ticketId, eventId]
        )
        if (!ticket) {
          throw new Error("Patron not found.")
        }
        const devices = await db.getAll<DeviceRow>(
          "SELECT id, device_type, quantity, colour FROM devices WHERE ticket_id = ?",
          [ticketId]
        )
        const note = await db.getOptional<NoteRow>(
          "SELECT content FROM notes WHERE ticket_id = ? ORDER BY recorded_at DESC LIMIT 1",
          [ticketId]
        )

        const next: DropOffBlankEntryFormState = {
          ticketNumber: String(ticket.ticket_number ?? ""),
          patronName: String(ticket.patron_name ?? ""),
          mobile: String(ticket.mobile ?? ""),
          email: String(ticket.email ?? ""),
          deviceCountMode: "preset",
          deviceCountPreset: "1",
          deviceCountCustom: "",
          devices:
            devices.length > 0
              ? devices.map((d) => ({
                  id: crypto.randomUUID(),
                  deviceType: toDeviceType(d.device_type),
                  quantity: Math.max(1, asInt(d.quantity)),
                  colour: toColour(d.colour),
                }))
              : [newDeviceRow()],
          notes: String(note?.content ?? "").trim(),
        }

        if (!cancelled) {
          setForm(next)
          setErr(null)
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load patron.")
          setForm(null)
        }
      } finally {
        // no-op
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eventId, open, ticketId])

  const save = React.useCallback(async () => {
    if (!eventId || !ticketId || !form) return
    const ticketNumber = validateTicketNumberRaw(form.ticketNumber)
    if (!ticketNumber) {
      toastError(`Ticket number must be ${TICKET_NUMBER_POOL_MIN}–${TICKET_NUMBER_POOL_MAX}.`)
      return
    }

    setIsSaving(true)
    setErr(null)
    try {
      await db.writeTransaction(async (tx) => {
        const conflict = await tx.getOptional<{ id: string }>(
          "SELECT id FROM tickets WHERE event_id = ? AND ticket_number = ? AND deleted_at IS NULL AND id <> ? LIMIT 1",
          [eventId, ticketNumber, ticketId]
        )
        if (conflict?.id) {
          throw new Error(`Ticket #${ticketNumber} is already used by another record.`)
        }

        await tx.execute(
          "UPDATE tickets SET ticket_number = ?, patron_name = ?, mobile = ?, email = ? WHERE id = ?",
          [
            ticketNumber,
            form.patronName.trim() ? form.patronName.trim() : null,
            form.mobile.trim() ? form.mobile.trim() : null,
            form.email.trim() ? form.email.trim() : null,
            ticketId,
          ]
        )

        await tx.execute("DELETE FROM devices WHERE ticket_id = ?", [ticketId])
        for (const row of form.devices) {
          await tx.execute(
            "INSERT INTO devices (id, ticket_id, device_type, quantity, colour) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), ticketId, row.deviceType, row.quantity, row.colour]
          )
        }

        const note = form.notes.trim()
        if (note) {
          await tx.execute(
            "INSERT INTO notes (id, ticket_id, content, recorded_at) VALUES (?, ?, ?, ?)",
            [crypto.randomUUID(), ticketId, note, Math.floor(Date.now() / 1000)]
          )
        }
      })

      success("✓ Patron updated")
      setOpen(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save patron."
      setErr(message)
      toastError(message)
    } finally {
      setIsSaving(false)
    }
  }, [eventId, form, success, ticketId, toastError])

  const remove = React.useCallback(async () => {
    if (!eventId || !ticketId) return
    setIsSaving(true)
    setErr(null)
    try {
      const name = form?.patronName?.trim() || "Patron"
      await db.writeTransaction(async (tx) => {
        const now = Math.floor(Date.now() / 1000)
        await tx.execute("UPDATE tickets SET deleted_at = ? WHERE id = ?", [now, ticketId])
      })
      success(`${name} removed`)
      setOpen(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete patron."
      setErr(message)
      toastError(message)
    } finally {
      setIsSaving(false)
    }
  }, [eventId, form, success, ticketId, toastError])

  const isLoading = Boolean(open && ticketId && eventId && !form && !err)

  return [
    { open, ticketId, form, isLoading, isSaving, error: err },
    { openFor, close, setForm, save, remove, onOpenChange },
  ]
}

