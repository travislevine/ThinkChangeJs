"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatPickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"
import type { PickupTicketDeviceLine, PickupTicketSummary } from "@/lib/types/pickup"

export interface PickupActiveTicketsGridProps {
  tickets: PickupTicketSummary[]
  deviceLinesByTicketId: Record<string, PickupTicketDeviceLine[]>
  /** Omitted when `completed` — cards are display-only. */
  onTicketSelect?: (ticket: PickupTicketSummary) => void
  /** Same card layout as active tickets, muted and non-interactive. */
  completed?: boolean
}

export function PickupActiveTicketsGrid({
  tickets,
  deviceLinesByTicketId,
  onTicketSelect,
  completed = false,
}: PickupActiveTicketsGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
      {tickets.map((t) => {
        const lines = deviceLinesByTicketId[t.ticketId] ?? []
        const breakdown = formatPickupDeviceBreakdown(lines)

        const card = (
          <Card
            size="sm"
            className={cn(
              "min-h-[44px]",
              completed ? "" : "cursor-pointer transition-colors hover:bg-muted/40"
            )}
          >
            <CardHeader className="gap-3">
              <Badge
                variant="default"
                className="h-auto w-fit rounded-md px-3 py-1.5 text-base font-semibold"
              >
                {formatTicketNumberLabel(t.ticketNumber)}
              </Badge>
              <div className="space-y-1">
                <div className="font-semibold text-foreground">{t.patronName}</div>
                {t.mobile ? (
                  <div className="text-sm text-muted-foreground">{t.mobile}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">No mobile</div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <p className="text-sm text-foreground">
                {breakdown.length > 0 ? breakdown : "No devices recorded"}
              </p>
              <p className="text-base font-bold text-foreground">
                {t.devicesRemaining}{" "}
                {t.devicesRemaining === 1 ? "device" : "devices"} remaining
              </p>
            </CardContent>
          </Card>
        )

        return (
          <li key={t.ticketId} className={completed ? "opacity-70" : undefined}>
            {completed ? (
              <div className="block w-full rounded-xl">{card}</div>
            ) : (
              <button
                type="button"
                className="ring-offset-background focus-visible:ring-ring block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => {
                  onTicketSelect?.(t)
                }}
              >
                {card}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
