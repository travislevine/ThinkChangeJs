"use client"

import * as React from "react"
import { ChevronDownIcon, PencilIcon, StickyNote, Trash2Icon } from "lucide-react"

import { useSyncStatus } from "@/contexts/SyncStatusContext"

import { SendSmsButton } from "@/components/check-ticket/SendSmsButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  badgeVariantForTicketStatus,
  labelForTicketRecordStatus,
} from "@/lib/constants/ticketStatus"
import { formatCheckTicketTimestamp } from "@/lib/utils/checkTicketFormat"
import { formatPickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"
import { formatTicketNumberLabel } from "@/lib/utils/ticketDisplay"
import type {
  CheckTicketNoteEntry,
  CheckTicketPickupEntry,
  CheckTicketTicketRow,
} from "@/lib/types/checkTicket"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

export interface CheckTicketRecordCardProps {
  ticket: CheckTicketTicketRow
  deviceLines: PickupTicketDeviceLine[]
  notes: CheckTicketNoteEntry[]
  pickups: CheckTicketPickupEntry[]
  onEditTicket: (ticketId: string) => void
  onAddNote: (ticketId: string) => void
  onDeleteTicket: () => void
}

function CollapsibleChevron({ open }: { open: boolean }) {
  return (
    <ChevronDownIcon
      className={"h-4 w-4 shrink-0 text-muted-foreground transition-transform" + (open ? " rotate-180" : "")}
      aria-hidden
    />
  )
}

export function CheckTicketRecordCard({
  ticket,
  deviceLines,
  notes,
  pickups,
  onEditTicket,
  onAddNote,
  onDeleteTicket,
}: CheckTicketRecordCardProps) {
  const { syncState } = useSyncStatus()
  const isOffline = syncState === "offline"
  const mobileTrimmed = ticket.mobile?.trim() ?? ""
  const hasMobile = mobileTrimmed.length > 0
  const patronForSms =
    ticket.patronName.trim().length > 0 ? ticket.patronName.trim() : null

  const [notesOpen, setNotesOpen] = React.useState(false)
  const [pickupsOpen, setPickupsOpen] = React.useState(false)

  const breakdown = formatPickupDeviceBreakdown(deviceLines)

  return (
    <Card size="sm" className="overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className="h-auto w-fit rounded-md px-3 py-1.5 text-base font-semibold"
          >
            {formatTicketNumberLabel(ticket.ticketNumber)}
          </Badge>
          <Badge variant={badgeVariantForTicketStatus(ticket.status)} className="text-xs font-medium">
            {labelForTicketRecordStatus(ticket.status)}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-foreground">{ticket.patronName}</div>
          <div className="text-sm text-muted-foreground">
            {ticket.mobile ? ticket.mobile : "No mobile"}
            {ticket.email ? ` · ${ticket.email}` : ""}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-2">
        <p className="text-sm text-foreground">
          {ticket.totalDevices} {ticket.totalDevices === 1 ? "device" : "devices"} total ·{" "}
          {ticket.devicesRemaining} remaining
        </p>
        <p className="text-sm text-foreground">
          {breakdown.length > 0 ? breakdown : "No devices recorded"}
        </p>

        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto min-h-[44px] w-full justify-between gap-2 px-2 py-2 text-left font-medium"
              aria-expanded={notesOpen}
            >
              Notes log
              <CollapsibleChevron open={notesOpen} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 px-2 pb-2">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notes.map((n) => (
                  <li key={n.noteId} className="text-sm">
                    <div className="text-xs text-muted-foreground">
                      {formatCheckTicketTimestamp(n.recordedAtSeconds)}
                    </div>
                    <div className="whitespace-pre-wrap text-foreground">{n.content || "—"}</div>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={pickupsOpen} onOpenChange={setPickupsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto min-h-[44px] w-full justify-between gap-2 px-2 py-2 text-left font-medium"
              aria-expanded={pickupsOpen}
            >
              Pick-up history
              <CollapsibleChevron open={pickupsOpen} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 px-2 pb-2">
            {pickups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pick-ups recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pickups.map((p) => {
                  const detail =
                    p.deviceLines.length > 0
                      ? formatPickupDeviceBreakdown(p.deviceLines)
                      : `${p.devicesPickedUp} device${p.devicesPickedUp === 1 ? "" : "s"}`
                  return (
                    <li key={p.pickupEventId} className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        {formatCheckTicketTimestamp(p.pickedUpAtSeconds)}
                      </div>
                      <div className="text-foreground">{detail}</div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 border-t bg-muted/40 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          aria-label="Edit ticket"
          onClick={() => {
            onEditTicket(ticket.ticketId)
          }}
        >
          <PencilIcon className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          aria-label="Add note"
          onClick={() => {
            onAddNote(ticket.ticketId)
          }}
        >
          <StickyNote className="h-5 w-5" />
        </Button>
        {hasMobile ? (
          <SendSmsButton
            ticketId={ticket.ticketId}
            ticketNumber={ticket.ticketNumber}
            patronName={patronForSms}
            mobile={mobileTrimmed}
            isOffline={isOffline}
          />
        ) : null}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          aria-label="Delete ticket record"
          onClick={() => {
            onDeleteTicket()
          }}
        >
          <Trash2Icon className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  )
}
