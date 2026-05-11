"use client"

import * as React from "react"

import {
  DASHBOARD_ACCENT_CARD_CLASS,
  DASHBOARD_ACCENT_TITLE_CLASS,
  DASHBOARD_ACCENT_VALUE_CLASS,
  DASHBOARD_DEVICE_CATEGORY_GRID_CLASS,
  DASHBOARD_DEVICE_CATEGORY_CARD_CLASS,
  DASHBOARD_DEVICE_CATEGORY_LABEL_CLASS,
  DASHBOARD_EMPTY_STATE_CLASS,
  DASHBOARD_ERROR_STATE_CLASS,
} from "@/components/dashboard/dashboardSurfaceStyles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
      <div className={DASHBOARD_EMPTY_STATE_CLASS}>
        No active event. Tap ⚙ to start one.
      </div>
    )
  }

  if (error) {
    return <div className={DASHBOARD_ERROR_STATE_CLASS}>Sync failed — changes saved locally</div>
  }

  if (isLoading || !stats) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className={DASHBOARD_ACCENT_CARD_CLASS}>
            <CardHeader>
              <CardTitle className={`text-sm ${DASHBOARD_ACCENT_TITLE_CLASS}`}>Total Dropped Off</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-28 bg-emerald-900/30" />
            </CardContent>
          </Card>
          <Card className={DASHBOARD_ACCENT_CARD_CLASS}>
            <CardHeader>
              <CardTitle className={`text-sm ${DASHBOARD_ACCENT_TITLE_CLASS}`}>Devices Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-28 bg-emerald-900/30" />
            </CardContent>
          </Card>
        </div>
        <div className={DASHBOARD_DEVICE_CATEGORY_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 min-w-0 w-full rounded-xl bg-emerald-600/40" />
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
        <Card className={DASHBOARD_ACCENT_CARD_CLASS}>
          <CardHeader>
            <CardTitle className={`text-sm ${DASHBOARD_ACCENT_TITLE_CLASS}`}>Total Dropped Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl ${DASHBOARD_ACCENT_VALUE_CLASS}`}>{formatNumber(totalDroppedOff)}</div>
          </CardContent>
        </Card>

        <Card className={DASHBOARD_ACCENT_CARD_CLASS}>
          <CardHeader>
            <CardTitle className={`text-sm ${DASHBOARD_ACCENT_TITLE_CLASS}`}>Devices Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl ${DASHBOARD_ACCENT_VALUE_CLASS}`}>{formatNumber(devicesRemaining)}</div>
          </CardContent>
        </Card>
      </div>

      <div className={DASHBOARD_DEVICE_CATEGORY_GRID_CLASS}>
        {stats.byCategory.map((row) => (
          <Card key={row.category} className={DASHBOARD_DEVICE_CATEGORY_CARD_CLASS}>
            <CardHeader className="px-3 sm:px-4">
              <CardTitle className="text-xs leading-snug font-semibold text-white sm:text-sm">
                {row.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-w-0 items-baseline justify-between gap-2 px-3 sm:gap-3 sm:px-4">
              <div className="min-w-0 flex flex-col gap-1">
                <div className={DASHBOARD_DEVICE_CATEGORY_LABEL_CLASS}>Dropped</div>
                <div className={`text-base sm:text-lg ${DASHBOARD_ACCENT_VALUE_CLASS}`}>
                  {formatNumber(row.droppedOff)}
                </div>
              </div>
              <div className="min-w-0 flex flex-col gap-1 text-right">
                <div className={DASHBOARD_DEVICE_CATEGORY_LABEL_CLASS}>Remaining</div>
                <div className={`text-base sm:text-lg ${DASHBOARD_ACCENT_VALUE_CLASS}`}>
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
