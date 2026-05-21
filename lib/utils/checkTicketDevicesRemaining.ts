import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"

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

/** Sum of per-type (dropped − picked), floored at zero for each type. */
export function computeDevicesRemainingFromDroppedAndPicked(
  dropped: Record<string, number>,
  picked: Record<string, number>
): number {
  const types = new Set([...Object.keys(dropped), ...Object.keys(picked)])
  let remaining = 0
  for (const deviceType of types) {
    const onHand = Math.max(0, dropped[deviceType] ?? 0)
    const pickedQty = Math.max(0, picked[deviceType] ?? 0)
    remaining += Math.max(0, onHand - pickedQty)
  }
  return remaining
}

/** After Edit ticket save: remaining devices still on the ticket and not yet picked up. */
export function computeDevicesRemainingForEditedDevices(
  devices: DropOffDeviceRow[],
  pickedByType: Record<string, number>
): number {
  return computeDevicesRemainingFromDroppedAndPicked(
    countDevicesByType(devices),
    pickedByType
  )
}
