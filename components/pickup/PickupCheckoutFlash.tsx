"use client"

import * as React from "react"

import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"

export interface PickupCheckoutFlashProps {
  ticketNumber: number | null
  onDismissed: () => void
}

export function PickupCheckoutFlash({ ticketNumber, onDismissed }: PickupCheckoutFlashProps) {
  React.useEffect(() => {
    if (ticketNumber === null) return
    const t = window.setTimeout(() => {
      onDismissed()
    }, 1500)
    return () => window.clearTimeout(t)
  }, [ticketNumber, onDismissed])

  if (ticketNumber === null) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-in fade-in duration-150 items-center justify-center bg-emerald-600 px-6 text-center text-xl font-semibold text-white zoom-in-95"
      role="status"
      aria-live="polite"
    >
      ✓ Ticket {formatTicketNumberLabel(ticketNumber)} fully checked out
    </div>
  )
}
