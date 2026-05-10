"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface PickupSearchFilterBarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  showCompleted: boolean
  onShowCompletedChange: (value: boolean) => void
}

export function PickupSearchFilterBar({
  searchQuery,
  onSearchQueryChange,
  showCompleted,
  onShowCompletedChange,
}: PickupSearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search ticket, name, or mobile…"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="min-h-[48px] text-base"
        autoComplete="off"
        inputMode="search"
        aria-label="Search tickets"
      />

      <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3">
        <Label htmlFor="pickup-show-completed" className="text-sm font-medium">
          Show Completed
        </Label>
        <Switch
          id="pickup-show-completed"
          checked={showCompleted}
          onCheckedChange={onShowCompletedChange}
          className="min-h-[44px]"
          aria-label="Show completed tickets"
        />
      </div>
    </div>
  )
}
