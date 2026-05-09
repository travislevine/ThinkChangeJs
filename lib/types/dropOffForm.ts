import type { Colour } from "@/lib/constants/colours"
import type { DeviceCategory } from "@/lib/constants/deviceCategories"

export interface DropOffDeviceRow {
  id: string
  deviceType: DeviceCategory
  quantity: number
  colour: Colour
}

export interface DropOffBlankEntryFormState {
  ticketNumber: string
  patronName: string
  mobile: string
  email: string
  deviceCountMode: "preset" | "custom"
  deviceCountPreset: string
  deviceCountCustom: string
  devices: DropOffDeviceRow[]
  notes: string
}

