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
import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"

export interface EditCheckTicketSheetProps {
  controller?: ReturnType<typeof useEditCheckTicket>
}

export function EditCheckTicketSheet({ controller }: EditCheckTicketSheetProps) {
  const fallback = useEditCheckTicket()
  const [state, actions] = controller ?? fallback

  const form = state.form

  const addDevice = React.useCallback(() => {
    actions.setForm((prev) => {
      if (!prev) return prev
      const nextRow: DropOffDeviceRow = {
        id: crypto.randomUUID(),
        deviceType: prev.devices[0]?.deviceType ?? DEVICE_CATEGORIES[0],
        quantity: 1,
        colour: prev.devices[0]?.colour ?? COLOURS[0],
      }
      return { ...prev, devices: [...prev.devices, nextRow] }
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

                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="check-ticket-edit-total">Total devices</Label>
                  <Input
                    id="check-ticket-edit-total"
                    inputMode="numeric"
                    className="min-h-[44px]"
                    value={form.totalDevices}
                    onChange={(e) =>
                      actions.setForm((prev) => (prev ? { ...prev, totalDevices: e.target.value } : prev))
                    }
                    disabled={state.isSaving}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label>Device rows</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={addDevice}
                  disabled={state.isSaving}
                >
                  Add device
                </Button>
              </div>

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
