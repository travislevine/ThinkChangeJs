import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

function countDevicesByType(devices: DropOffDeviceRow[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of devices) {
    const deviceType = row.deviceType.trim()
    if (!deviceType) {
      continue
    }
    counts[deviceType] = (counts[deviceType] ?? 0) + 1
  }
  return counts
}

function countsToLines(counts: Record<string, number>): PickupTicketDeviceLine[] {
  return Object.entries(counts)
    .filter(([, quantity]) => quantity > 0)
    .map(([deviceType, quantity]) => ({ deviceType, quantity }))
}

export interface CheckTicketDeviceDiff {
  added: PickupTicketDeviceLine[]
  removed: PickupTicketDeviceLine[]
}

export function diffCheckTicketDevices(
  before: DropOffDeviceRow[],
  after: DropOffDeviceRow[]
): CheckTicketDeviceDiff {
  const beforeCounts = countDevicesByType(before)
  const afterCounts = countDevicesByType(after)
  const types = new Set([...Object.keys(beforeCounts), ...Object.keys(afterCounts)])

  const addedCounts: Record<string, number> = {}
  const removedCounts: Record<string, number> = {}

  for (const deviceType of types) {
    const prev = beforeCounts[deviceType] ?? 0
    const next = afterCounts[deviceType] ?? 0
    if (next > prev) {
      addedCounts[deviceType] = next - prev
    }
    if (prev > next) {
      removedCounts[deviceType] = prev - next
    }
  }

  return {
    added: countsToLines(addedCounts),
    removed: countsToLines(removedCounts),
  }
}
