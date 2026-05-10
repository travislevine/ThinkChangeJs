"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"
import type { PickupTicketSummary } from "@/lib/types/pickup"

export interface PickupTicketPickupDialogProps {
  ticket: PickupTicketSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PickupTicketPickupDialog({
  ticket,
  open,
  onOpenChange,
}: PickupTicketPickupDialogProps) {
  const title = ticket
    ? `Pick Up — Ticket ${formatTicketNumberLabel(ticket.ticketNumber)}`
    : "Pick Up"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Confirm quantities and complete pick-up in the next step.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
