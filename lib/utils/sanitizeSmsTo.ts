/**
 * Normalises patron mobile input toward E.164 for Twilio `to`.
 * Strips spaces, dashes, and brackets; maps common Australian patterns to +61.
 */
export function sanitizeSmsToE164(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ""
  }

  const noSeparators = trimmed
    .replace(/\s/g, "")
    .replace(/[-()[\]]/g, "")
  if (!noSeparators) {
    return ""
  }

  if (noSeparators.startsWith("+")) {
    const digitsAfterPlus = noSeparators.slice(1).replace(/\D/g, "")
    return digitsAfterPlus ? `+${digitsAfterPlus}` : ""
  }

  const digits = noSeparators.replace(/\D/g, "")
  if (!digits) {
    return ""
  }

  if (digits.startsWith("0") && digits.length >= 9) {
    return `+61${digits.slice(1)}`
  }

  if (digits.startsWith("61") && digits.length >= 11) {
    return `+${digits}`
  }

  return `+${digits}`
}
