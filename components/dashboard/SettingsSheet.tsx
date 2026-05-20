"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import { ExportEventSelector } from "@/components/dashboard/ExportEventSelector"
import { ExportPinDialog } from "@/components/dashboard/ExportPinDialog"
import { NewEventDialog } from "@/components/dashboard/NewEventDialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useEvent } from "@/contexts/EventContext"
import { useExportCsv } from "@/hooks/useExportCsv"
import { usePinAuth } from "@/hooks/usePinAuth"

export interface SettingsSheetProps {
  trigger: React.ReactNode
}

function formatEventStart(seconds: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(seconds * 1000)
  )
}

export function SettingsSheet({ trigger }: SettingsSheetProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { currentEvent } = useEvent()
  const { lock } = usePinAuth()

  const [open, setOpen] = React.useState(false)
  const [exportPinOpen, setExportPinOpen] = React.useState(false)
  const [newEventOpen, setNewEventOpen] = React.useState(false)
  const [selectedEventId, setSelectedEventId] = React.useState("")
  const [selectedEventName, setSelectedEventName] = React.useState("")

  const handleExportEventChange = React.useCallback((eventId: string, eventName: string) => {
    setSelectedEventId(eventId)
    setSelectedEventName(eventName)
  }, [])

  const { triggerExport, isExporting } = useExportCsv(selectedEventId, selectedEventName)

  const isDark = theme === "dark" || (!theme && typeof window !== "undefined")
  const exportDisabled = !selectedEventId.trim() || isExporting

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-3 rounded-md border border-border px-3 py-3">
              <span className="text-sm font-medium">Data Export</span>
              <ExportEventSelector onEventChange={handleExportEventChange} />
              <Button
                type="button"
                variant="default"
                className="min-h-[44px] w-full gap-2"
                disabled={exportDisabled}
                onClick={() => setExportPinOpen(true)}
              >
                {isExporting ? (
                  <>
                    <Loader2Icon className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    Exporting…
                  </>
                ) : (
                  "Export CSV"
                )}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="min-h-[44px]"
                aria-label="Toggle dark mode"
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-1 rounded-md border border-border px-3 py-3">
              <span className="text-sm font-medium">Current event</span>
              {currentEvent ? (
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{currentEvent.name}</div>
                  <div>Started {formatEventStart(currentEvent.startedAt)}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active event yet. Tap “Start New Event” to begin.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="destructive"
                className="min-h-[44px] w-full"
                onClick={() => setNewEventOpen(true)}
              >
                Start New Event
              </Button>

              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] w-full"
                onClick={() => {
                  lock()
                  setOpen(false)
                  router.push("/pin")
                }}
              >
                Lock App
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ExportPinDialog
        open={exportPinOpen}
        onOpenChange={setExportPinOpen}
        onVerified={() => triggerExport()}
      />

      <NewEventDialog open={newEventOpen} onOpenChange={setNewEventOpen} />
    </>
  )
}

SettingsSheet.displayName = "SettingsSheet"

