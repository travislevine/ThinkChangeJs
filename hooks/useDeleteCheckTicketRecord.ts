"use client"

import * as React from "react"

import { INLINE_POWER_SYNC_SAVE_FAILED } from "@/lib/constants/inlineErrors"
import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import { db } from "@/lib/db/powersync"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"

export interface DeleteCheckTicketTarget {
  ticketId: string
  ticketNumber: number
}

export interface DeleteCheckTicketRecordState {
  open: boolean
  target: DeleteCheckTicketTarget | null
  isDeleting: boolean
  error: string | null
}

export interface DeleteCheckTicketRecordActions {
  openFor: (ticketId: string, ticketNumber: number) => void
  close: () => void
  onOpenChange: (open: boolean) => void
  confirm: () => Promise<void>
}

export function useDeleteCheckTicketRecord(): [
  DeleteCheckTicketRecordState,
  DeleteCheckTicketRecordActions,
] {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const { success } = useToast()

  const [open, setOpen] = React.useState(false)
  const [target, setTarget] = React.useState<DeleteCheckTicketTarget | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const reset = React.useCallback(() => {
    setTarget(null)
    setErr(null)
  }, [])

  const openFor = React.useCallback((ticketId: string, ticketNumber: number) => {
    setTarget({ ticketId, ticketNumber })
    setErr(null)
    setOpen(true)
  }, [])

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) reset()
    },
    [reset]
  )

  const close = React.useCallback(() => {
    setOpen(false)
    reset()
  }, [reset])

  const confirm = React.useCallback(async () => {
    if (!eventId || !target) return
    setIsDeleting(true)
    setErr(null)
    try {
      await db.writeTransaction(async (tx) => {
        const row = await tx.getOptional<{ id: string }>(
          "SELECT id FROM tickets WHERE id = ? AND event_id = ? AND deleted_at IS NULL LIMIT 1",
          [target.ticketId, eventId]
        )
        if (!row?.id) {
          throw new Error("Ticket not found.")
        }
        const now = Math.floor(Date.now() / 1000)
        await tx.execute("UPDATE tickets SET deleted_at = ? WHERE id = ?", [now, target.ticketId])

        const pool = await tx.getOptional<{ id: string }>(
          "SELECT id FROM ticket_numbers WHERE event_id = ? AND number = ? LIMIT 1",
          [eventId, target.ticketNumber]
        )
        if (pool?.id) {
          await tx.execute("UPDATE ticket_numbers SET status = 'available' WHERE id = ?", [pool.id])
        }
      })

      success(`Ticket ${formatTicketNumberLabel(target.ticketNumber)} deleted`)
      close()
    } catch {
      setErr(INLINE_POWER_SYNC_SAVE_FAILED)
    } finally {
      setIsDeleting(false)
    }
  }, [close, eventId, success, target])

  const actions = React.useMemo(
    () => ({ openFor, close, onOpenChange, confirm }),
    [openFor, close, onOpenChange, confirm]
  )

  return [{ open, target, isDeleting, error: err }, actions]
}
