"use client"

import * as React from "react"
import Link from "next/link"
import { Settings } from "lucide-react"

import {
  DASHBOARD_CATEGORY_BUTTON_CLASS,
  DASHBOARD_OUTLINE_BUTTON_CLASS,
} from "@/components/dashboard/dashboardSurfaceStyles"
import { SettingsSheet } from "@/components/dashboard/SettingsSheet"
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator"
import { Button } from "@/components/ui/button"

function formatToday(): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date())
}

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-emerald-950 dark:text-emerald-50">BikePark</h1>
        <p className="text-sm text-emerald-800/80 dark:text-emerald-100/80">{formatToday()}</p>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button asChild size="lg" variant="ghost" className={DASHBOARD_CATEGORY_BUTTON_CLASS}>
            <Link href="/park">Drop-Off</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className={DASHBOARD_OUTLINE_BUTTON_CLASS}>
            <Link href="/pickup">Pick Up</Link>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <SyncStatusIndicator />
          <SettingsSheet
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] text-emerald-800 hover:bg-emerald-600/15 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}

DashboardHeader.displayName = "DashboardHeader"

