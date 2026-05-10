"use client"

import * as React from "react"

import { PickupDeviceTypePickRow } from "@/components/pickup/PickupDeviceTypePickRow"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvent } from "@/contexts/EventContext"
import { inlineMessageForPickupWrite } from "@/lib/constants/inlineErrors"
import { useCompletePickup } from "@/hooks/useCompletePickup"
import { usePickupTicketPickupDetail } from "@/hooks/usePickupTicketPickupDetail"
import { useToast } from "@/hooks/useToast"
import { formatPickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"
import type { PickupTicketDeviceLine, PickupTicketSummary } from "@/lib/types/pickup"

export interface PickupTicketPickupDialogProps {
  ticket: PickupTicketSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFullyCheckedOut: (ticketNumber: number) => void
}

function sumPicks(r: Record<string, number>): number {
  let s = 0
  for (const v of Object.values(r)) {
    s += v
  }
  return s
}

export function PickupTicketPickupDialog({
  ticket,
  open,
  onOpenChange,
  onFullyCheckedOut,
}: PickupTicketPickupDialogProps) {
  const { currentEvent } = useEvent()
  const { complete, isSubmitting } = useCompletePickup()
  const { success } = useToast()

  const ticketId = ticket?.ticketId ?? null
  const { lines, ticketDevicesRemaining, isLoading: detailLoading, error: detailError } =
    usePickupTicketPickupDetail(ticketId, open && Boolean(ticketId))

  const [pickQuantities, setPickQuantities] = React.useState<Record<string, number>>({})
  const [verified, setVerified] = React.useState(false)
  const [pickupWriteError, setPickupWriteError] = React.useState<string | null>(null)

  const onPickQuantityChange = React.useCallback((deviceType: string, next: number) => {
    setPickupWriteError(null)
    setPickQuantities((prev) => ({
      ...prev,
      [deviceType]: next,
    }))
  }, [])

  const droppedLinesForLabel: PickupTicketDeviceLine[] = lines.map((l) => ({
    deviceType: l.deviceType,
    quantity: l.dropped,
  }))
  const readOnlyBreakdown = formatPickupDeviceBreakdown(droppedLinesForLabel)

  const totalPickThisSession = sumPicks(pickQuantities)
  const remainingAfter = Math.max(0, ticketDevicesRemaining - totalPickThisSession)

  const pickableRows = lines.filter((l) => l.remaining > 0)
  const canPickAnything = pickableRows.length > 0

  const title = ticket
    ? `Pick Up — Ticket ${formatTicketNumberLabel(ticket.ticketNumber)}`
    : "Pick Up"

  const verifyId = ticket ? `pickup-verify-${ticket.ticketId}` : "pickup-verify"

  const onSubmit = React.useCallback(async (): Promise<void> => {
    if (!ticket || !currentEvent || !verified) return
    setPickupWriteError(null)

    try {
      const ok = await complete({
        eventId: currentEvent.id,
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        picksByType: pickQuantities,
      })

      if (ok.newRemaining === 0) {
        onFullyCheckedOut(ticket.ticketNumber)
      } else {
        const r = ok.newRemaining
        success(
          `✓ Partial pick-up recorded — ${r} device${r === 1 ? "" : "s"} remaining`
        )
      }
      onOpenChange(false)
    } catch (e) {
      setPickupWriteError(inlineMessageForPickupWrite(e))
    }
  }, [
    complete,
    currentEvent,
    onFullyCheckedOut,
    onOpenChange,
    pickQuantities,
    success,
    ticket,
    verified,
  ])

  const confirmDisabled =
    !verified ||
    totalPickThisSession <= 0 ||
    isSubmitting ||
    detailLoading ||
    Boolean(detailError) ||
    !canPickAnything ||
    !currentEvent

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose how many devices of each type are leaving on this pick-up.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-2">
          {detailLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : detailError ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              {detailError}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">On this ticket</div>
                <p className="text-sm text-foreground">
                  {readOnlyBreakdown.length > 0 ? readOnlyBreakdown : "No devices recorded"}
                </p>
              </div>

              {!canPickAnything ? (
                <p className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                  Nothing left to pick up for this ticket by type. Close and refresh if this looks
                  wrong.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="text-xs font-medium text-muted-foreground">Pick up now</div>
                  {pickableRows.map((line) => (
                    <PickupDeviceTypePickRow
                      key={line.deviceType}
                      line={line}
                      value={pickQuantities[line.deviceType] ?? 0}
                      onChange={(next) => {
                        onPickQuantityChange(line.deviceType, next)
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="rounded-md border border-border bg-muted/30 px-3 py-3 text-sm">
                <span className="text-muted-foreground">Devices remaining after this pick-up: </span>
                <span className="font-bold text-foreground">{remainingAfter}</span>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id={verifyId}
                  checked={verified}
                  onCheckedChange={(v) => {
                    setPickupWriteError(null)
                    setVerified(v === true)
                  }}
                  className="mt-1"
                />
                <Label htmlFor={verifyId} className="text-sm leading-snug font-normal">
                  Device(s) verified against Ticket {ticket ? formatTicketNumberLabel(ticket.ticketNumber) : ""}
                </Label>
              </div>
            </>
          )}
        </div>

        {pickupWriteError ? (
          <div className="border-t border-border bg-muted/40 px-4 py-3 text-sm text-destructive">
            {pickupWriteError}
          </div>
        ) : null}

        <DialogFooter className="bg-muted/40 sm:justify-end">
          <Button
            type="button"
            className="min-h-[44px] w-full sm:w-auto"
            disabled={confirmDisabled}
            onClick={() => {
              void onSubmit()
            }}
          >
            Complete Pick-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
