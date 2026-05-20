import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

function categorySortIndex(deviceType: string): number {
  const idx = (DEVICE_CATEGORIES as readonly string[]).indexOf(deviceType)
  return idx >= 0 ? idx : DEVICE_CATEGORIES.length
}

/** Inline breakdown e.g. `Bikes ×2 · Prams ×1`. */
export function formatPickupDeviceBreakdown(lines: PickupTicketDeviceLine[]): string {
  if (lines.length === 0) return ""

  const sorted = [...lines].sort((a, b) => {
    const d = categorySortIndex(a.deviceType) - categorySortIndex(b.deviceType)
    if (d !== 0) return d
    return a.deviceType.localeCompare(b.deviceType)
  })

  return sorted.map((l) => `${l.deviceType} ×${l.quantity}`).join(" · ")
}

/** Parses {@link formatPickupDeviceBreakdown} output back into device lines. */
export function parsePickupDeviceBreakdown(text: string): PickupTicketDeviceLine[] {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const lines: PickupTicketDeviceLine[] = []
  for (const part of trimmed.split(" · ")) {
    const segment = part.trim()
    const match = segment.match(/^(.+) ×(\d+)$/)
    if (!match) {
      continue
    }
    const quantity = Math.floor(Number(match[2]))
    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue
    }
    lines.push({ deviceType: match[1].trim(), quantity })
  }
  return lines
}
