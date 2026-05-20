"use client"

import * as React from "react"

import { CheckTicketRecordCard } from "@/components/check-ticket/CheckTicketRecordCard"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  CheckTicketNoteEntry,
  CheckTicketPickupEntry,
  CheckTicketTicketRow,
} from "@/lib/types/checkTicket"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

export interface CheckTicketRecordListProps {
  activeTickets: CheckTicketTicketRow[]
  completedTickets: CheckTicketTicketRow[]
  showCompleted: boolean
  /** Count of tickets for the event before search filter. */
  eventTicketCount: number
  deviceLinesByTicketId: Record<string, PickupTicketDeviceLine[]>
  notesByTicketId: Record<string, CheckTicketNoteEntry[]>
  pickupsByTicketId: Record<string, CheckTicketPickupEntry[]>
  isLoading: boolean
  /** Only when the main ticket list query fails — not device/note enrichment. */
  ticketsError: string | null
  onEditTicket: (ticketId: string) => void
  onAddNote: (ticketId: string) => void
  onDeleteTicket: (ticketId: string, ticketNumber: number) => void
}

function TicketCards({
  tickets,
  deviceLinesByTicketId,
  notesByTicketId,
  pickupsByTicketId,
  onEditTicket,
  onAddNote,
  onDeleteTicket,
}: {
  tickets: CheckTicketTicketRow[]
  deviceLinesByTicketId: Record<string, PickupTicketDeviceLine[]>
  notesByTicketId: Record<string, CheckTicketNoteEntry[]>
  pickupsByTicketId: Record<string, CheckTicketPickupEntry[]>
  onEditTicket: (ticketId: string) => void
  onAddNote: (ticketId: string) => void
  onDeleteTicket: (ticketId: string, ticketNumber: number) => void
}): React.ReactElement {
  return (
    <ul className="flex flex-col gap-4">
      {tickets.map((t) => (
        <li key={t.ticketId}>
          <CheckTicketRecordCard
            ticket={t}
            deviceLines={deviceLinesByTicketId[t.ticketId] ?? []}
            notes={notesByTicketId[t.ticketId] ?? []}
            pickups={pickupsByTicketId[t.ticketId] ?? []}
            onEditTicket={onEditTicket}
            onAddNote={onAddNote}
            onDeleteTicket={() => {
              onDeleteTicket(t.ticketId, t.ticketNumber)
            }}
          />
        </li>
      ))}
    </ul>
  )
}

export function CheckTicketRecordList({
  activeTickets,
  completedTickets,
  showCompleted,
  eventTicketCount,
  deviceLinesByTicketId,
  notesByTicketId,
  pickupsByTicketId,
  isLoading,
  ticketsError,
  onEditTicket,
  onAddNote,
  onDeleteTicket,
}: CheckTicketRecordListProps): React.ReactElement {
  if (ticketsError) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
        Failed to load tickets for this event.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const visibleCount = activeTickets.length + (showCompleted ? completedTickets.length : 0)

  if (visibleCount === 0) {
    const emptyMessage =
      eventTicketCount === 0
        ? "No ticket records for this event."
        : "No tickets match your search."
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {activeTickets.length > 0 ? (
        <TicketCards
          tickets={activeTickets}
          deviceLinesByTicketId={deviceLinesByTicketId}
          notesByTicketId={notesByTicketId}
          pickupsByTicketId={pickupsByTicketId}
          onEditTicket={onEditTicket}
          onAddNote={onAddNote}
          onDeleteTicket={onDeleteTicket}
        />
      ) : showCompleted ? (
        <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No active tickets match your search.
        </p>
      ) : null}

      {showCompleted ? (
        <section className="flex flex-col gap-4" aria-label="Completed tickets">
          <div className="flex items-center gap-3 py-1">
            <Separator className="flex-1" />
            <span className="shrink-0 text-sm font-medium text-muted-foreground">Completed</span>
            <Separator className="flex-1" />
          </div>
          {completedTickets.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              No completed tickets match your search.
            </p>
          ) : (
            <TicketCards
              tickets={completedTickets}
              deviceLinesByTicketId={deviceLinesByTicketId}
              notesByTicketId={notesByTicketId}
              pickupsByTicketId={pickupsByTicketId}
              onEditTicket={onEditTicket}
              onAddNote={onAddNote}
              onDeleteTicket={onDeleteTicket}
            />
          )}
        </section>
      ) : null}
    </div>
  )
}
