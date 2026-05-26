import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

/** Counts one row per physical device (quantity 1 per form row). */
export function aggregateDevicesToBreakdown(
  devices: ReadonlyArray<{ deviceType: string }>
): PickupTicketDeviceLine[] {
  const counts = new Map<string, number>()
  for (const device of devices) {
    const label = device.deviceType.trim() || "Other"
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([deviceType, quantity]) => ({
    deviceType,
    quantity,
  }))
}
