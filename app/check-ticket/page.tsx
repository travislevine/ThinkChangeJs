"use client"

import * as React from "react"
import { RefreshCwIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { CheckTicketSearchControls } from "@/components/check-ticket/CheckTicketSearchControls"
import { Button } from "@/components/ui/button"
import { useSyncStatus } from "@/contexts/SyncStatusContext"
import { CHECK_TICKET_SORT_MODE } from "@/lib/constants/checkTicket"
import type { CheckTicketSortMode } from "@/lib/constants/checkTicket"
import { useCheckTicketTickets } from "@/hooks/useCheckTicketTickets"

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
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

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {ticketsError
            ? "Failed to load tickets for this event."
            : ticketsLoading
              ? "Loading tickets."
              : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} match the current search and sort.`}
        </p>
      </div>
    </div>
  )
}
