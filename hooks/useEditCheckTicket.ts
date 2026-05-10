"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import { db } from "@/lib/db/powersync"
import { loadCheckTicketEditState } from "@/lib/db/loadCheckTicketEditState"
import type { CheckTicketEditFormState } from "@/lib/types/checkTicketEdit"
import { computeDevicesRemainingAfterTotalChange } from "@/lib/utils/checkTicketDevicesRemaining"
import { validateCheckTicketEditForm } from "@/lib/utils/checkTicketEditValidation"

export interface EditCheckTicketState {
  open: boolean
  ticketId: string | null
  ticketNumber: number | null
  form: CheckTicketEditFormState | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

export interface EditCheckTicketActions {
  openFor: (ticketId: string) => void
  close: () => void
  onOpenChange: (open: boolean) => void
  setForm: React.Dispatch<React.SetStateAction<CheckTicketEditFormState | null>>
  save: () => Promise<void>
}

export function useEditCheckTicket(): [EditCheckTicketState, EditCheckTicketActions] {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const { success, error: toastError } = useToast()

  const [open, setOpen] = React.useState(false)
  const [ticketId, setTicketId] = React.useState<string | null>(null)
  const [ticketNumber, setTicketNumber] = React.useState<number | null>(null)
  const [baselineTotal, setBaselineTotal] = React.useState<number>(0)
  const [baselineRemaining, setBaselineRemaining] = React.useState<number>(0)
  const [form, setForm] = React.useState<CheckTicketEditFormState | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const openFor = React.useCallback((id: string) => {
    setForm(null)
    setErr(null)
    setTicketNumber(null)
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
      const result = await loadCheckTicketEditState(ticketId, eventId)
      if (cancelled) return
      if (result.ok) {
        setTicketNumber(result.ticketNumber)
        setBaselineTotal(result.baselineTotal)
        setBaselineRemaining(result.baselineRemaining)
        setForm(result.form)
        setErr(null)
      } else {
        setErr(result.message)
        setForm(null)
        setTicketNumber(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eventId, open, ticketId])

  const save = React.useCallback(async () => {
    if (!eventId || !ticketId || !form) return
    const validationError = validateCheckTicketEditForm(form)
    if (validationError) {
      toastError(validationError)
      return
    }

    const newTotal = Math.floor(Number(form.totalDevices.trim()))
    const nextRemaining = computeDevicesRemainingAfterTotalChange(
      baselineTotal,
      baselineRemaining,
      newTotal
    )

    setIsSaving(true)
    setErr(null)
    try {
      await db.writeTransaction(async (tx) => {
        await tx.execute(
          "UPDATE tickets SET patron_name = ?, mobile = ?, email = ?, total_devices = ?, devices_remaining = ? WHERE id = ? AND event_id = ? AND deleted_at IS NULL",
          [
            form.patronName.trim() ? form.patronName.trim() : null,
            form.mobile.trim() ? form.mobile.trim() : null,
            form.email.trim() ? form.email.trim() : null,
            newTotal,
            nextRemaining,
            ticketId,
            eventId,
          ]
        )

        await tx.execute("DELETE FROM devices WHERE ticket_id = ?", [ticketId])
        for (const row of form.devices) {
          await tx.execute(
            "INSERT INTO devices (id, ticket_id, device_type, quantity, colour) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), ticketId, row.deviceType, row.quantity, row.colour]
          )
        }
      })

      success("✓ Ticket updated")
      setOpen(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save ticket."
      setErr(message)
      toastError(message)
    } finally {
      setIsSaving(false)
    }
  }, [
    baselineRemaining,
    baselineTotal,
    eventId,
    form,
    success,
    ticketId,
    toastError,
  ])

  const isLoading = Boolean(open && ticketId && eventId && !form && !err)

  const actions = React.useMemo(
    () => ({ openFor, close, onOpenChange, setForm, save }),
    [openFor, close, onOpenChange, setForm, save]
  )

  return [
    { open, ticketId, ticketNumber, form, isLoading, isSaving, error: err },
    actions,
  ]
}
