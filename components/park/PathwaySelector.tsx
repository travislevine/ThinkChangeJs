"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { DropOffPathway } from "@/lib/types/dropOff"

export interface PathwaySelectorProps {
  value: DropOffPathway
  onChange: (next: DropOffPathway) => void
}

export function PathwaySelector({ value, onChange }: PathwaySelectorProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          variant={value === "blank" ? "default" : "outline"}
          className="min-h-[44px] w-full justify-start"
          onClick={() => onChange("blank")}
        >
          Blank Entry
        </Button>
        <Button
          type="button"
          size="lg"
          variant={value === "pre_registered" ? "default" : "outline"}
          className="min-h-[44px] w-full justify-start"
          onClick={() => onChange("pre_registered")}
        >
          Pre-Registered
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="text-sm text-muted-foreground">
        {value === "blank"
          ? "Use this for walk-ups or manual entries."
          : "Search and select a pre-registered patron."}
      </div>
    </div>
  )
}

PathwaySelector.displayName = "PathwaySelector"

