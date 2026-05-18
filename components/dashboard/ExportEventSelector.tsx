"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"

const EVENTS_SQL = `
  SELECT id, name, started_at
  FROM events
  ORDER BY started_at DESC
`

export interface ExportEventListItem {
  id: string
  name: string
  startedAt: number
}

export interface ExportEventSelectorProps {
  onEventChange: (eventId: string, eventName: string) => void
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function parseEventRow(row: Record<string, unknown>): ExportEventListItem | null {
  if (typeof row.id !== "string") return null
  const name = String(row.name ?? "").trim() || "Unnamed event"
  const startedAt = asInt(row.started_at)
  return { id: row.id, name, startedAt }
}

function formatEventOptionLabel(item: ExportEventListItem): string {
  const when =
    item.startedAt > 0
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(item.startedAt * 1000)
        )
      : "Unknown date"
  return `${item.name} · ${when}`
}

function resolveDefaultEventId(
  events: ExportEventListItem[],
  currentEventId: string | undefined
): string {
  if (events.length === 0) return ""
  if (currentEventId && events.some((e) => e.id === currentEventId)) {
    return currentEventId
  }
  return events[0].id
}

export function ExportEventSelector({ onEventChange }: ExportEventSelectorProps) {
  const { currentEvent } = useEvent()
  const [events, setEvents] = React.useState<ExportEventListItem[]>([])
  const [userSelectedId, setUserSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const ac = new AbortController()
    db.watch(
      EVENTS_SQL,
      [],
      {
        onResult: (result) => {
          const raw = (result.rows?._array ?? []) as unknown[]
          const parsed = raw
            .map((r) => parseEventRow(r as Record<string, unknown>))
            .filter((e): e is ExportEventListItem => e != null)
          setEvents(parsed)
        },
        onError: () => {
          setEvents([])
        },
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [])

  const selectedId = React.useMemo(() => {
    if (events.length === 0) return ""
    if (userSelectedId && events.some((e) => e.id === userSelectedId)) {
      return userSelectedId
    }
    return resolveDefaultEventId(events, currentEvent?.id)
  }, [events, userSelectedId, currentEvent?.id])

  const selectedEventName = selectedId
    ? (events.find((e) => e.id === selectedId)?.name ?? "")
    : ""

  React.useEffect(() => {
    if (!selectedId.trim()) {
      onEventChange("", "")
      return
    }
    onEventChange(selectedId, selectedEventName)
  }, [selectedId, selectedEventName, onEventChange])

  const onValueChange = React.useCallback((nextId: string) => {
    setUserSelectedId(nextId)
  }, [])

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events found</p>
  }

  if (events.length === 1) {
    const only = events[0]
    return (
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">Event to export</Label>
        <p className="text-sm text-muted-foreground">{formatEventOptionLabel(only)}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="export-event-select" className="text-sm font-medium">
        Event to export
      </Label>
      <Select value={selectedId || undefined} onValueChange={onValueChange}>
        <SelectTrigger id="export-event-select" className="min-h-[44px] w-full">
          <SelectValue placeholder="Select event" />
        </SelectTrigger>
        <SelectContent>
          {events.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {formatEventOptionLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

ExportEventSelector.displayName = "ExportEventSelector"
