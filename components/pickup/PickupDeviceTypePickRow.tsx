"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PickupTypeRemaining } from "@/lib/types/pickup"

export interface PickupDeviceTypePickRowProps {
  line: PickupTypeRemaining
  value: number
  onChange: (next: number) => void
}

export function PickupDeviceTypePickRow({ line, value, onChange }: PickupDeviceTypePickRowProps) {
  if (line.remaining <= 0) return null

  const options = Array.from({ length: line.remaining + 1 }, (_, i) => i)
  const safe = Math.min(Math.max(0, Math.floor(value)), line.remaining)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium">{line.deviceType}</span>
      <Select
        value={String(safe)}
        onValueChange={(v) => {
          onChange(Number(v))
        }}
      >
        <SelectTrigger className="min-h-[44px] w-full min-w-[120px] sm:w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
