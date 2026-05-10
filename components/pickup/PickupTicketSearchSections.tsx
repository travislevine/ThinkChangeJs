"use client"

import * as React from "react"

import { PickupActiveTicketsGrid } from "@/components/pickup/PickupActiveTicketsGrid"
import { PickupCheckoutFlash } from "@/components/pickup/PickupCheckoutFlash"
import { PickupTicketPickupDialog } from "@/components/pickup/PickupTicketPickupDialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { PickupTicketDeviceLine, PickupTicketSummary } from "@/lib/types/pickup"

export interface PickupTicketSearchSectionsProps {
  activeTickets: PickupTicketSummary[]
  completedTickets: PickupTicketSummary[]
  showCompleted: boolean
  isLoading: boolean
  deviceLinesByTicketId: Record<string, PickupTicketDeviceLine[]>
  isDevicesLoading: boolean
  error: string | null
  devicesError: string | null
}

export function PickupTicketSearchSections({
  activeTickets,
  completedTickets,
  showCompleted,
  isLoading,
  deviceLinesByTicketId,
  isDevicesLoading,
  error,
  devicesError,
}: PickupTicketSearchSectionsProps) {
  const [pickupTicket, setPickupTicket] = React.useState<PickupTicketSummary | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [flashTicketNumber, setFlashTicketNumber] = React.useState<number | null>(null)
  const [dialogSession, setDialogSession] = React.useState(0)

  const onFlashDismissed = React.useCallback(() => {
    setFlashTicketNumber(null)
  }, [])

  const onActiveTicketSelect = React.useCallback((t: PickupTicketSummary) => {
    setPickupTicket(t)
    setDialogSession((s) => s + 1)
    setDialogOpen(true)
  }, [])

  const onDialogOpenChange = React.useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setPickupTicket(null)
    }
  }, [])

  const loadError = error ?? devicesError
  const gridLoading = isLoading || isDevicesLoading

  if (loadError) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
        Failed to load tickets for pick-up.
      </div>
    )
  }

  if (gridLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const completedBlock = showCompleted ? (
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
        <PickupActiveTicketsGrid
          tickets={completedTickets}
          deviceLinesByTicketId={deviceLinesByTicketId}
          completed
        />
      )}
    </section>
  ) : null

  return (
    <>
      <PickupCheckoutFlash ticketNumber={flashTicketNumber} onDismissed={onFlashDismissed} />

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3" aria-label="Active tickets">
          {activeTickets.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              No active devices currently parked.
            </div>
          ) : (
            <PickupActiveTicketsGrid
              tickets={activeTickets}
              deviceLinesByTicketId={deviceLinesByTicketId}
              onTicketSelect={onActiveTicketSelect}
            />
          )}
        </section>

        {completedBlock}
      </div>

      <PickupTicketPickupDialog
        key={dialogSession}
        ticket={pickupTicket}
        open={dialogOpen}
        onOpenChange={onDialogOpenChange}
        onFullyCheckedOut={(n) => {
          setFlashTicketNumber(n)
        }}
      />
    </>
  )
}
