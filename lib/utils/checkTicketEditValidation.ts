import type { CheckTicketEditFormState } from "@/lib/types/checkTicketEdit"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

function normaliseMobileDigits(value: string): string {
  return value.replace(/\D/g, "")
}

export function sumDeviceRowQuantities(devices: DropOffDeviceRow[]): number {
  return devices.reduce((acc, d) => acc + Math.max(0, asInt(d.quantity)), 0)
}

/** Returns a user-facing error message, or null when valid. */
export function validateCheckTicketEditForm(form: CheckTicketEditFormState): string | null {
  const name = form.patronName.trim()
  if (name && !/^[A-Za-z ]+$/.test(name)) {
    return "Name: use letters A–Z only."
  }

  const mobile = form.mobile.trim()
  if (mobile) {
    const digits = normaliseMobileDigits(mobile)
    if (digits.length > 10) return "Mobile number must be at most 10 digits."
    if (digits.length !== 10) return "Mobile number must be 10 digits."
    if (!digits.startsWith("0")) return "Mobile number must start with 0."
  }

  const email = form.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address."
  }

  const totalParsed = Number(form.totalDevices.trim())
  if (!Number.isFinite(totalParsed) || totalParsed < 1 || totalParsed > 99) {
    return "Total devices must be between 1 and 99."
  }
  const total = Math.floor(totalParsed)

  if (!form.devices.length) {
    return "Add at least one device row."
  }

  const rowSum = sumDeviceRowQuantities(form.devices)
  if (rowSum !== total) {
    return `Total devices (${total}) must match the sum of device quantities (${rowSum}).`
  }

  return null
}
