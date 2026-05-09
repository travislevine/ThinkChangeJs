"use client"

import * as React from "react"

import { DeviceRow } from "@/components/park/DeviceRow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useEditPreRegisteredPatron } from "@/hooks/useEditPreRegisteredPatron"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"

export interface EditPatronSheetProps {
  controller?: ReturnType<typeof useEditPreRegisteredPatron>
}

export function EditPatronSheet({ controller }: EditPatronSheetProps) {
  const fallback = useEditPreRegisteredPatron()
  const [state, actions] = controller ?? fallback

  const form = state.form

  const addDevice = React.useCallback(() => {
    actions.setForm((prev) => {
      if (!prev) return prev
      const nextRow: DropOffDeviceRow = {
        id: crypto.randomUUID(),
        deviceType: prev.devices[0]?.deviceType ?? "Other",
        quantity: 1,
        colour: prev.devices[0]?.colour ?? "Other",
      }
      return { ...prev, devices: [...prev.devices, nextRow] }
    })
  }, [actions])

  return (
    <Sheet open={state.open} onOpenChange={actions.onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <SheetHeader>
          <SheetTitle>Edit patron</SheetTitle>
        </SheetHeader>

        <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-4 pb-4">
          {state.error ? (
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {state.error}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-ticket-number">Ticket Number</Label>
              <Input
                id="edit-ticket-number"
                inputMode="numeric"
                className="min-h-[44px]"
                value={form?.ticketNumber ?? ""}
                onChange={(e) =>
                  actions.setForm((prev) => (prev ? { ...prev, ticketNumber: e.target.value } : prev))
                }
                disabled={!form || state.isLoading || state.isSaving}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                className="min-h-[44px]"
                value={form?.patronName ?? ""}
                onChange={(e) =>
                  actions.setForm((prev) => (prev ? { ...prev, patronName: e.target.value } : prev))
                }
                disabled={!form || state.isLoading || state.isSaving}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-mobile">Mobile</Label>
              <Input
                id="edit-mobile"
                type="tel"
                className="min-h-[44px]"
                value={form?.mobile ?? ""}
                onChange={(e) =>
                  actions.setForm((prev) => (prev ? { ...prev, mobile: e.target.value } : prev))
                }
                disabled={!form || state.isLoading || state.isSaving}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                className="min-h-[44px]"
                value={form?.email ?? ""}
                onChange={(e) =>
                  actions.setForm((prev) => (prev ? { ...prev, email: e.target.value } : prev))
                }
                disabled={!form || state.isLoading || state.isSaving}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label>Devices</Label>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={addDevice}
              disabled={!form || state.isLoading || state.isSaving}
            >
              Add Device
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {(form?.devices ?? []).map((row) => (
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

          <div className="grid gap-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={form?.notes ?? ""}
              onChange={(e) =>
                actions.setForm((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
              }
              disabled={!form || state.isLoading || state.isSaving}
            />
          </div>
        </div>

        <SheetFooter className="border-t border-border bg-muted/30">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            <DeletePatronButton onDelete={actions.remove} disabled={state.isSaving || state.isLoading} />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

EditPatronSheet.displayName = "EditPatronSheet"

export function useEditPatronSheetController() {
  return useEditPreRegisteredPatron()
}

function DeletePatronButton({
  onDelete,
  disabled,
}: {
  onDelete: () => Promise<void>
  disabled: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="min-h-[44px]"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Delete
      </Button>

      {/* Using AlertDialog from the global UI kit */}
      <DeletePatronDialog open={open} onOpenChange={setOpen} onConfirm={onDelete} />
    </>
  )
}

function DeletePatronDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove patron?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove this pre-registered patron from the list?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive" className="min-h-[44px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px]"
            onClick={(e) => {
              e.preventDefault()
              void (async () => {
                await onConfirm()
                onOpenChange(false)
              })()
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

