"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  showCompleted: boolean
  onShowCompletedChange: (value: boolean) => void
}

export function CheckTicketSearchControls({
  searchQuery,
  onSearchQueryChange,
  sortMode,
  onSortModeChange,
  showCompleted,
  onShowCompletedChange,
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

      <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3">
        <Label htmlFor="check-ticket-show-completed" className="text-sm font-medium">
          Show Completed
        </Label>
        <Switch
          id="check-ticket-show-completed"
          checked={showCompleted}
          onCheckedChange={onShowCompletedChange}
          className="min-h-[44px]"
          aria-label="Show completed tickets"
        />
      </div>

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
