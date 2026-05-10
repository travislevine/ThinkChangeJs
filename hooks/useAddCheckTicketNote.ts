"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"
import { db } from "@/lib/db/powersync"

export interface AddCheckTicketNoteState {
  open: boolean
  ticketId: string | null
  content: string
  isSaving: boolean
  error: string | null
}

export interface AddCheckTicketNoteActions {
  openFor: (ticketId: string) => void
  close: () => void
  onOpenChange: (open: boolean) => void
  setContent: React.Dispatch<React.SetStateAction<string>>
  save: () => Promise<void>
}

export function useAddCheckTicketNote(): [AddCheckTicketNoteState, AddCheckTicketNoteActions] {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null
  const { success, error: toastError } = useToast()

  const [open, setOpen] = React.useState(false)
  const [ticketId, setTicketId] = React.useState<string | null>(null)
  const [content, setContent] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const reset = React.useCallback(() => {
    setTicketId(null)
    setContent("")
    setErr(null)
  }, [])

  const openFor = React.useCallback((id: string) => {
    setTicketId(id)
    setContent("")
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

  const save = React.useCallback(async () => {
    const text = content.trim()
    if (!text) {
      toastError("Enter a note before saving.")
      return
    }
    if (!eventId || !ticketId) return

    setIsSaving(true)
    setErr(null)
    try {
      await db.writeTransaction(async (tx) => {
        const row = await tx.getOptional<{ id: string }>(
          "SELECT id FROM tickets WHERE id = ? AND event_id = ? AND deleted_at IS NULL LIMIT 1",
          [ticketId, eventId]
        )
        if (!row?.id) {
          throw new Error("Ticket not found.")
        }
        const now = Math.floor(Date.now() / 1000)
        await tx.execute(
          "INSERT INTO notes (id, ticket_id, content, recorded_at) VALUES (?, ?, ?, ?)",
          [crypto.randomUUID(), ticketId, text, now]
        )
      })

      success("✓ Note saved")
      close()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save note."
      setErr(message)
      toastError(message)
    } finally {
      setIsSaving(false)
    }
  }, [close, content, eventId, success, ticketId, toastError])

  const actions = React.useMemo(
    () => ({ openFor, close, onOpenChange, setContent, save }),
    [openFor, close, onOpenChange, setContent, save]
  )

  return [{ open, ticketId, content, isSaving, error: err }, actions]
}
