"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CHECK_TICKET_SORT_MODE,
  labelForCheckTicketSortMode,
} from "@/lib/constants/checkTicket"
import type { CheckTicketSortMode } from "@/lib/constants/checkTicket"

export interface CheckTicketSearchControlsProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  sortMode: CheckTicketSortMode
  onSortModeChange: (mode: CheckTicketSortMode) => void
}

export function CheckTicketSearchControls({
  searchQuery,
  onSearchQueryChange,
  sortMode,
  onSortModeChange,
}: CheckTicketSearchControlsProps) {
  const onToggleSort = React.useCallback(() => {
    onSortModeChange(
      sortMode === CHECK_TICKET_SORT_MODE.NEWEST_FIRST
        ? CHECK_TICKET_SORT_MODE.TICKET_NUMBER_ASC
        : CHECK_TICKET_SORT_MODE.NEWEST_FIRST
    )
  }, [onSortModeChange, sortMode])

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search ticket, name, or mobile…"
        value={searchQuery}
        onChange={(e) => {
          onSearchQueryChange(e.target.value)
        }}
        className="min-h-[48px] text-base"
        autoComplete="off"
        inputMode="search"
        aria-label="Search tickets"
      />

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="min-h-[44px] w-full sm:w-fit"
        onClick={onToggleSort}
        aria-label={`Sort: ${labelForCheckTicketSortMode(sortMode)}. Toggle sort order.`}
      >
        {labelForCheckTicketSortMode(sortMode)}
      </Button>
    </div>
  )
}
