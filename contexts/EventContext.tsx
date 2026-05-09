"use client"

import * as React from "react"

import type { EventSummary } from "@/lib/types/event"

export interface EventContextValue {
  currentEvent: EventSummary | null
  startNewEvent: () => void
  closeCurrentEvent: () => void
}

const EventContext = React.createContext<EventContextValue | null>(null)

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [currentEvent] = React.useState<EventSummary | null>(null)

  const startNewEvent = React.useCallback(() => {
    // Wired to PowerSync in Phase 0.8+
  }, [])

  const closeCurrentEvent = React.useCallback(() => {
    // Wired to PowerSync in Phase 0.8+
  }, [])

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

export function useEvent(): EventContextValue {
  const ctx = React.useContext(EventContext)
  if (!ctx) {
    throw new Error("useEvent must be used within EventProvider")
  }
  return ctx
}
