"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatPickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"
import type { PickupTicketDeviceLine, PickupTicketSummary } from "@/lib/types/pickup"

export interface PickupActiveTicketsGridProps {
  tickets: PickupTicketSummary[]
  deviceLinesByTicketId: Record<string, PickupTicketDeviceLine[]>
  onTicketSelect: (ticket: PickupTicketSummary) => void
}

export function PickupActiveTicketsGrid({
  tickets,
  deviceLinesByTicketId,
  onTicketSelect,
}: PickupActiveTicketsGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
      {tickets.map((t) => {
        const lines = deviceLinesByTicketId[t.ticketId] ?? []
        const breakdown = formatPickupDeviceBreakdown(lines)

        return (
          <li key={t.ticketId}>
            <button
              type="button"
              className="ring-offset-background focus-visible:ring-ring block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={() => {
                onTicketSelect(t)
              }}
            >
              <Card
                size="sm"
                className="min-h-[44px] cursor-pointer transition-colors hover:bg-muted/40"
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
            </button>
          </li>
        )
      })}
    </ul>
  )
}
