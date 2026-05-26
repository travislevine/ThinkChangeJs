/** Strip to digits only (no country prefix). */
export function normaliseAuMobileDigits(raw: string): string {
  return raw.replace(/\D/g, "")
}

/**
 * Returns a 10-digit AU mobile starting with `0`, or null when invalid.
 * Accepts common patron input (spaces, +61, etc.).
 */
export function normaliseAuMobileForStorage(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  let digits = normaliseAuMobileDigits(trimmed)
  if (digits.startsWith("61") && digits.length === 11) {
    digits = `0${digits.slice(2)}`
  }

  if (digits.length !== 10 || !digits.startsWith("0")) {
    return null
  }

  return digits
}
