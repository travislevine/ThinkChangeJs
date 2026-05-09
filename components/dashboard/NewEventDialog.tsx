"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEvent } from "@/contexts/EventContext"
import { useToast } from "@/hooks/useToast"

export interface NewEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDefaultEventName(date: Date): string {
  const label = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
  return `Event – ${label}`
}

function formatDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

function parseDateTimeLocalValue(value: string): number | null {
  if (!value.trim()) return null
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  return Math.floor(ms / 1000)
}

export function NewEventDialog({ open, onOpenChange }: NewEventDialogProps) {
  const { success, error } = useToast()
  const { startNewEvent } = useEvent()

  const [submitting, setSubmitting] = React.useState(false)
  const [name, setName] = React.useState("")
  const [startedAt, setStartedAt] = React.useState<Date>(() => new Date())
  const [endedAt, setEndedAt] = React.useState("")

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          const now = new Date()
          setStartedAt(now)
          setName(formatDefaultEventName(now))
          setEndedAt("")
          setSubmitting(false)
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Start new event</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive all current data and start a new event.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="new-event-name">Event name</Label>
            <Input
              id="new-event-name"
              placeholder="Event – 2 May 2025, 9:00 AM"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="new-event-started">Start time</Label>
            <Input
              id="new-event-started"
              value={formatDateTimeLocalValue(startedAt)}
              readOnly
              disabled
              className="min-h-[44px]"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="new-event-ended">End time (optional)</Label>
            <Input
              id="new-event-ended"
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel variant="destructive" className="min-h-[44px]" disabled={submitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px]"
            disabled={submitting || !name.trim()}
            onClick={async (e) => {
              e.preventDefault()
              if (submitting) return
              const trimmed = name.trim()
              if (!trimmed) return

              const ended = parseDateTimeLocalValue(endedAt)

              try {
                setSubmitting(true)
                await startNewEvent({
                  name: trimmed,
                  startedAt: Math.floor(startedAt.getTime() / 1000),
                  endedAt: ended,
                })
                success("✓ New event started")
                onOpenChange(false)
              } catch (err) {
                error(err instanceof Error ? err.message : "Failed to start new event")
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Start New Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

NewEventDialog.displayName = "NewEventDialog"

