"use client"

import * as React from "react"

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { PickupTicketSummary } from "@/lib/types/pickup"

export interface PickupTicketSearchSectionsProps {
  activeTickets: PickupTicketSummary[]
  completedTickets: PickupTicketSummary[]
  showCompleted: boolean
  isLoading: boolean
  error: string | null
}

function TicketLine({ t }: { t: PickupTicketSummary }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
      <span className="font-medium text-foreground">#{t.ticketNumber}</span>
      <span className="text-muted-foreground"> · {t.patronName}</span>
      {t.mobile ? <span className="block text-xs text-muted-foreground">{t.mobile}</span> : null}
    </div>
  )
}

export function PickupTicketSearchSections({
  activeTickets,
  completedTickets,
  showCompleted,
  isLoading,
  error,
}: PickupTicketSearchSectionsProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
        Failed to load tickets for pick-up.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  const completedBlock = showCompleted ? (
    <section className="flex flex-col gap-3" aria-label="Completed tickets">
      <Separator className="my-1" />
      <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
      {completedTickets.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No completed tickets match your search.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {completedTickets.map((t) => (
            <li key={t.ticketId}>
              <TicketLine t={t} />
            </li>
          ))}
        </ul>
      )}
    </section>
  ) : null

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-label="Active tickets">
        {activeTickets.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No active devices currently parked.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeTickets.map((t) => (
              <li key={t.ticketId}>
                <TicketLine t={t} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {completedBlock}
    </div>
  )
}
