"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvent } from "@/contexts/EventContext"
import { useCurrentEventStats } from "@/hooks/useCurrentEventStats"

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

const DEVICE_CATEGORY_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-3 p-1 sm:gap-4 md:grid-cols-2 lg:grid-cols-4"

const DEVICE_CATEGORY_CARD_CLASS =
  "min-h-32 min-w-0 w-full overflow-visible border-2 border-emerald-900 bg-emerald-600 text-white shadow-sm ring-0 dark:border-emerald-300 dark:bg-emerald-500"

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

  if (isLoading || !stats) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Dropped Off</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-28" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Devices Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-28" />
            </CardContent>
          </Card>
        </div>
        <div className={DEVICE_CATEGORY_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 min-w-0 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const totalDroppedOff = stats.totalDroppedOff
  const devicesRemaining = stats.devicesRemaining

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Dropped Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{formatNumber(totalDroppedOff)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Devices Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{formatNumber(devicesRemaining)}</div>
          </CardContent>
        </Card>
      </div>

      <div className={DEVICE_CATEGORY_GRID_CLASS}>
        {stats.byCategory.map((row) => (
          <Card key={row.category} className={DEVICE_CATEGORY_CARD_CLASS}>
            <CardHeader className="px-3 sm:px-4">
              <CardTitle className="text-xs leading-snug font-semibold text-white sm:text-sm">
                {row.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-w-0 items-baseline justify-between gap-2 px-3 sm:gap-3 sm:px-4">
              <div className="min-w-0 flex flex-col gap-1">
                <div className="text-[11px] font-medium text-emerald-50/90 sm:text-xs">Dropped</div>
                <div className="text-base font-semibold tabular-nums text-white sm:text-lg">
                  {formatNumber(row.droppedOff)}
                </div>
              </div>
              <div className="min-w-0 flex flex-col gap-1 text-right">
                <div className="text-[11px] font-medium text-emerald-50/90 sm:text-xs">Remaining</div>
                <div className="text-base font-semibold tabular-nums text-white sm:text-lg">
                  {formatNumber(row.remaining)}
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
