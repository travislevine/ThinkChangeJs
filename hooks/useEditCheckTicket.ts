"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import {
  CHECK_TICKET_DEVICE_ADDED_NOTE_PREFIX,
  CHECK_TICKET_DEVICE_REMOVED_NOTE_PREFIX,
} from "@/lib/constants/checkTicketNotes"
import { INLINE_POWER_SYNC_SAVE_FAILED } from "@/lib/constants/inlineErrors"
import { db } from "@/lib/db/powersync"
import { loadCheckTicketEditState } from "@/lib/db/loadCheckTicketEditState"
import type { CheckTicketEditFormState } from "@/lib/types/checkTicketEdit"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import { diffCheckTicketDevices } from "@/lib/utils/checkTicketDeviceDiff"
import { computeDevicesRemainingAfterTotalChange } from "@/lib/utils/checkTicketDevicesRemaining"
import { validateCheckTicketEditForm } from "@/lib/utils/checkTicketEditValidation"
import { formatPickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"

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
  const [baselineDevices, setBaselineDevices] = React.useState<DropOffDeviceRow[]>([])
  const [form, setForm] = React.useState<CheckTicketEditFormState | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const openFor = React.useCallback((id: string) => {
    setForm(null)
    setErr(null)
    setTicketNumber(null)
    setBaselineDevices([])
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
        setBaselineDevices(
          result.form.devices.map((row) => ({
            ...row,
            id: row.id,
          }))
        )
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

    const newTotal = form.devices.length
    const nextRemaining = computeDevicesRemainingAfterTotalChange(
      baselineTotal,
      baselineRemaining,
      newTotal
    )

    const deviceDiff = diffCheckTicketDevices(baselineDevices, form.devices)

    setIsSaving(true)
    setErr(null)
    try {
      await db.writeTransaction(async (tx) => {
        const now = Math.floor(Date.now() / 1000)

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
            [crypto.randomUUID(), ticketId, row.deviceType, 1, row.colour]
          )
        }

        if (deviceDiff.added.length > 0) {
          const addedBreakdown = formatPickupDeviceBreakdown(deviceDiff.added)
          await tx.execute(
            "INSERT INTO notes (id, ticket_id, content, recorded_at) VALUES (?, ?, ?, ?)",
            [
              crypto.randomUUID(),
              ticketId,
              `${CHECK_TICKET_DEVICE_ADDED_NOTE_PREFIX}${addedBreakdown}`,
              now,
            ]
          )
        }

        if (deviceDiff.removed.length > 0) {
          const removedBreakdown = formatPickupDeviceBreakdown(deviceDiff.removed)
          await tx.execute(
            "INSERT INTO notes (id, ticket_id, content, recorded_at) VALUES (?, ?, ?, ?)",
            [
              crypto.randomUUID(),
              ticketId,
              `${CHECK_TICKET_DEVICE_REMOVED_NOTE_PREFIX}${removedBreakdown}`,
              now,
            ]
          )
        }
      })

      success("✓ Ticket updated")
      setOpen(false)
    } catch {
      setErr(INLINE_POWER_SYNC_SAVE_FAILED)
    } finally {
      setIsSaving(false)
    }
  }, [
    baselineDevices,
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
