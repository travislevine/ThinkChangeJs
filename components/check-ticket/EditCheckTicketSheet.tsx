"use client"

import * as React from "react"

import { DeviceRow } from "@/components/park/DeviceRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditCheckTicket } from "@/hooks/useEditCheckTicket"
import { MAX_DEVICES_PER_TICKET } from "@/lib/constants/ticketDevices"
import { newEmptyDeviceRow } from "@/lib/utils/expandDeviceRows"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"

export interface EditCheckTicketSheetProps {
  controller?: ReturnType<typeof useEditCheckTicket>
}

export function EditCheckTicketSheet({ controller }: EditCheckTicketSheetProps) {
  const fallback = useEditCheckTicket()
  const [state, actions] = controller ?? fallback

  const form = state.form
  const deviceCount = form?.devices.length ?? 0
  const atDeviceLimit = deviceCount >= MAX_DEVICES_PER_TICKET

  const addDevice = React.useCallback(() => {
    actions.setForm((prev) => {
      if (!prev || prev.devices.length >= MAX_DEVICES_PER_TICKET) return prev
      return { ...prev, devices: [...prev.devices, newEmptyDeviceRow()] }
    })
  }, [actions])

  return (
    <Sheet open={state.open} onOpenChange={actions.onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <SheetHeader>
          <SheetTitle>Edit ticket</SheetTitle>
        </SheetHeader>

        <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-4 pb-4">
          {state.isLoading ? (
            <div className="flex flex-col gap-3 py-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : null}

          {state.error && !state.isLoading ? (
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {state.error}
            </div>
          ) : null}

          {!state.isLoading && state.ticketNumber != null ? (
            <div className="grid gap-1.5">
              <Label>Ticket number</Label>
              <Badge
                variant="secondary"
                className="h-auto w-fit rounded-md px-3 py-2 text-base font-semibold"
              >
                {formatTicketNumberLabel(state.ticketNumber)}
              </Badge>
            </div>
          ) : null}

          {!state.isLoading && form ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="check-ticket-edit-name">Name</Label>
                  <Input
                    id="check-ticket-edit-name"
                    className="min-h-[44px]"
                    value={form.patronName}
                    onChange={(e) =>
                      actions.setForm((prev) => (prev ? { ...prev, patronName: e.target.value } : prev))
                    }
                    disabled={state.isSaving}
                    autoComplete="name"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="check-ticket-edit-mobile">Mobile</Label>
                  <Input
                    id="check-ticket-edit-mobile"
                    type="tel"
                    className="min-h-[44px]"
                    value={form.mobile}
                    onChange={(e) =>
                      actions.setForm((prev) => (prev ? { ...prev, mobile: e.target.value } : prev))
                    }
                    disabled={state.isSaving}
                    autoComplete="tel"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="check-ticket-edit-email">Email</Label>
                  <Input
                    id="check-ticket-edit-email"
                    type="email"
                    className="min-h-[44px]"
                    value={form.email}
                    onChange={(e) =>
                      actions.setForm((prev) => (prev ? { ...prev, email: e.target.value } : prev))
                    }
                    disabled={state.isSaving}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <Label>Devices</Label>
                  <p className="text-sm text-muted-foreground">
                    {deviceCount} {deviceCount === 1 ? "device" : "devices"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={addDevice}
                  disabled={state.isSaving || atDeviceLimit}
                >
                  Add device
                </Button>
              </div>
              {atDeviceLimit ? (
                <p className="text-sm text-muted-foreground">
                  Maximum {MAX_DEVICES_PER_TICKET} devices per patron.
                </p>
              ) : null}

              <div className="flex flex-col gap-3">
                {form.devices.map((row) => (
                  <DeviceRow
                    key={row.id}
                    value={row}
                    onChange={(next) =>
                      actions.setForm((prev) =>
                        prev
                          ? { ...prev, devices: prev.devices.map((d) => (d.id === row.id ? next : d)) }
                          : prev
                      )
                    }
                    onRemove={() =>
                      actions.setForm((prev) => {
                        if (!prev) return prev
                        if (prev.devices.length <= 1) return prev
                        return { ...prev, devices: prev.devices.filter((d) => d.id !== row.id) }
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <SheetFooter className="border-t border-border bg-muted/30">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={actions.close}
              disabled={state.isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-[44px]"
              onClick={() => void actions.save()}
              disabled={state.isSaving || state.isLoading || !form}
            >
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

EditCheckTicketSheet.displayName = "EditCheckTicketSheet"
