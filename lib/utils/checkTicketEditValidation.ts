import type { CheckTicketEditFormState } from "@/lib/types/checkTicketEdit"
import { validateDeviceRows } from "@/lib/utils/deviceRowValidation"

function normaliseMobileDigits(value: string): string {
  return value.replace(/\D/g, "")
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

  return validateDeviceRows(form.devices)
}
