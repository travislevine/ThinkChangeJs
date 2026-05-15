import { MAX_DEVICES_PER_TICKET } from "@/lib/constants/ticketDevices"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import { isDeviceRowComplete } from "@/lib/utils/expandDeviceRows"

/** Returns a user-facing error message, or null when valid. */
export function validateDeviceRows(devices: DropOffDeviceRow[]): string | null {
  if (!devices.length) {
    return "Add at least one device."
  }
  if (devices.length > MAX_DEVICES_PER_TICKET) {
    return `Reduce to at most ${MAX_DEVICES_PER_TICKET} devices.`
  }
  for (let i = 0; i < devices.length; i++) {
    if (!isDeviceRowComplete(devices[i])) {
      return "Select a device type and colour for every device."
    }
  }
  return null
}
