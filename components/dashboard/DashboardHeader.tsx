"use client"

import * as React from "react"
import Link from "next/link"
import { Settings2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SettingsSheet } from "@/components/dashboard/SettingsSheet"
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator"

function formatToday(): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date())
}

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">BikePark</h1>
        <p className="text-sm text-muted-foreground">{formatToday()}</p>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button asChild size="lg" className="min-h-[44px] w-full">
            <Link href="/park">Park</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-[44px] w-full">
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
                className="min-h-[44px] min-w-[44px]"
                aria-label="Open settings"
              >
                <Settings2Icon className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}

DashboardHeader.displayName = "DashboardHeader"

