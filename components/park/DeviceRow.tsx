"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COLOURS, type Colour } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES, type DeviceCategory } from "@/lib/constants/deviceCategories"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"

export interface DeviceRowProps {
  value: DropOffDeviceRow
  onChange: (next: DropOffDeviceRow) => void
  onRemove: () => void
}

const QUANTITIES = Array.from({ length: 10 }, (_, i) => i + 1)

export function DeviceRow({ value, onChange, onRemove }: DeviceRowProps) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label>Device Type</Label>
          <Select
            value={value.deviceType}
            onValueChange={(next) =>
              onChange({ ...value, deviceType: next as DeviceCategory })
            }
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DEVICE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Qty</Label>
          <Select
            value={String(value.quantity)}
            onValueChange={(next) => onChange({ ...value, quantity: Number(next) })}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUANTITIES.map((q) => (
                <SelectItem key={q} value={String(q)}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Colour</Label>
          <Select
            value={value.colour}
            onValueChange={(next) =>
              onChange({ ...value, colour: next as Colour })
            }
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select colour" />
            </SelectTrigger>
            <SelectContent>
              {COLOURS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={onRemove}
          aria-label="Remove device row"
        >
          <Trash2Icon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

DeviceRow.displayName = "DeviceRow"

