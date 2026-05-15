import { COLOURS, type Colour } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES, type DeviceCategory } from "@/lib/constants/deviceCategories"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"

export type DbDeviceRow = {
  device_type: string | null
  quantity: number | string | null
  colour: string | null
}

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function toDeviceType(v: string | null): DeviceCategory | "" {
  const s = String(v ?? "")
  if ((DEVICE_CATEGORIES as readonly string[]).includes(s)) {
    return s as DeviceCategory
  }
  return s ? "Other" : ""
}

function toColour(v: string | null): Colour | "" {
  const s = String(v ?? "")
  if ((COLOURS as readonly string[]).includes(s)) {
    return s as Colour
  }
  return s ? "Other" : ""
}

export function newEmptyDeviceRow(): DropOffDeviceRow {
  return {
    id: crypto.randomUUID(),
    deviceType: "",
    quantity: 1,
    colour: "",
  }
}

/** Each DB row with quantity N becomes N form rows (quantity always 1). */
export function expandDbDevicesToFormRows(rows: DbDeviceRow[]): DropOffDeviceRow[] {
  const expanded: DropOffDeviceRow[] = []
  for (const d of rows) {
    const qty = Math.max(1, asInt(d.quantity))
    const deviceType = toDeviceType(d.device_type)
    const colour = toColour(d.colour)
    for (let i = 0; i < qty; i++) {
      expanded.push({
        id: crypto.randomUUID(),
        deviceType,
        quantity: 1,
        colour,
      })
    }
  }
  return expanded
}

export function countDeviceRows(devices: DropOffDeviceRow[]): number {
  return devices.length
}

export function isDeviceRowComplete(row: DropOffDeviceRow): boolean {
  return row.deviceType !== "" && row.colour !== ""
}
