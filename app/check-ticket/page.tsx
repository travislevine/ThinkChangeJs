"use client"

import * as React from "react"
import { RefreshCwIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { CheckTicketRecordList } from "@/components/check-ticket/CheckTicketRecordList"
import { CheckTicketSearchControls } from "@/components/check-ticket/CheckTicketSearchControls"
import { EditCheckTicketSheet } from "@/components/check-ticket/EditCheckTicketSheet"
import { Button } from "@/components/ui/button"
import { useSyncStatus } from "@/contexts/SyncStatusContext"
import { CHECK_TICKET_SORT_MODE } from "@/lib/constants/checkTicket"
import type { CheckTicketSortMode } from "@/lib/constants/checkTicket"
import { useCheckTicketRecordDetails } from "@/hooks/useCheckTicketRecordDetails"
import { useCheckTicketTickets } from "@/hooks/useCheckTicketTickets"
import { useEditCheckTicket } from "@/hooks/useEditCheckTicket"
import { usePickupTicketDeviceLines } from "@/hooks/usePickupTicketDeviceLines"

export default function CheckTicketPage() {
  const router = useRouter()
  const { retrySync } = useSyncStatus()
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortMode, setSortMode] = React.useState<CheckTicketSortMode>(
    CHECK_TICKET_SORT_MODE.NEWEST_FIRST
  )

  const { tickets, isLoading: ticketsLoading, error: ticketsError } = useCheckTicketTickets(
    searchQuery,
    sortMode
  )
  const {
    linesByTicketId,
    isLoading: devicesLoading,
    error: devicesError,
  } = usePickupTicketDeviceLines()
  const { notesByTicketId, pickupsByTicketId, isLoading: detailsLoading } =
    useCheckTicketRecordDetails()

  const editTicketController = useEditCheckTicket()
  const [, editTicketActions] = editTicketController

  const onEditTicket = React.useCallback(
    (ticketId: string) => {
      editTicketActions.openFor(ticketId)
    },
    [editTicketActions]
  )

  const onAddNote = React.useCallback(() => {
    /* Phase 4.5 — add note sheet */
  }, [])

  const onDeleteTicket = React.useCallback(() => {
    /* Phase 4.6 — delete dialog */
  }, [])

  const onBack = React.useCallback(() => {
    router.push("/")
  }, [router])

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return
    try {
      setRefreshing(true)
      await retrySync()
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, retrySync])

  const listLoading = ticketsLoading || devicesLoading || detailsLoading

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[44px] w-fit"
          onClick={onBack}
        >
          ← Back
        </Button>

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Check Ticket</h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px] shrink-0"
            onClick={() => {
              void onRefresh()
            }}
            disabled={refreshing}
            aria-label="Refresh ticket data and sync"
          >
            <RefreshCwIcon className={"h-5 w-5" + (refreshing ? " animate-spin" : "")} />
          </Button>
        </div>

        <CheckTicketSearchControls
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
        />

        {devicesError ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            Device breakdown could not be loaded. Cards may show incomplete device lines until refresh.
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2">
          <CheckTicketRecordList
            tickets={tickets}
            deviceLinesByTicketId={linesByTicketId}
            notesByTicketId={notesByTicketId}
            pickupsByTicketId={pickupsByTicketId}
            isLoading={listLoading}
            ticketsError={ticketsError}
            onEditTicket={onEditTicket}
            onAddNote={onAddNote}
            onDeleteTicket={onDeleteTicket}
          />
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {ticketsError
            ? "Failed to load tickets for this event."
            : listLoading
              ? "Loading tickets."
              : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} match the current search and sort.`}
        </p>

        <EditCheckTicketSheet controller={editTicketController} />
      </div>
    </div>
  )
}
