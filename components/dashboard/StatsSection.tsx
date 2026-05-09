"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEvent } from "@/contexts/EventContext"
import { useCurrentEventStats } from "@/hooks/useCurrentEventStats"

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

export function StatsSection() {
  const { currentEvent } = useEvent()
  const { stats, isLoading, error } = useCurrentEventStats()

  if (!currentEvent) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        No active event. Tap ⚙ to start one.
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        Sync failed — changes saved locally
      </div>
    )
  }

  const totalDroppedOff = stats?.totalDroppedOff ?? 0
  const devicesRemaining = stats?.devicesRemaining ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Dropped Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {isLoading ? "…" : formatNumber(totalDroppedOff)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Devices Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {isLoading ? "…" : formatNumber(devicesRemaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(stats?.byCategory ?? []).map((row) => (
          <Card key={row.category}>
            <CardHeader>
              <CardTitle className="text-sm">{row.category}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground">Dropped</div>
                <div className="text-lg font-semibold tabular-nums">
                  {isLoading ? "…" : formatNumber(row.droppedOff)}
                </div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="text-xs text-muted-foreground">Remaining</div>
                <div className="text-lg font-semibold tabular-nums">
                  {isLoading ? "…" : formatNumber(row.remaining)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

StatsSection.displayName = "StatsSection"

