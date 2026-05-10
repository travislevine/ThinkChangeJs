"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { CheckTicketRecordCard } from "@/components/check-ticket/CheckTicketRecordCard"
import type { CheckTicketNoteEntry, CheckTicketPickupEntry, CheckTicketTicketRow } from "@/lib/types/checkTicket"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

export interface CheckTicketRecordListProps {
  tickets: CheckTicketTicketRow[]
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

export function CheckTicketRecordList({
  tickets,
  eventTicketCount,
  deviceLinesByTicketId,
  notesByTicketId,
  pickupsByTicketId,
  isLoading,
  ticketsError,
  onEditTicket,
  onAddNote,
  onDeleteTicket,
}: CheckTicketRecordListProps) {
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

  if (tickets.length === 0) {
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
