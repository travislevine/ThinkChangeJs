import { EXPORT_PIN_PATTERN } from "@/lib/constants/exportPin"

export function isExportPinConfigured(): boolean {
  const expected = process.env.NEXT_PUBLIC_EXPORT_PIN?.trim()
  return Boolean(expected && EXPORT_PIN_PATTERN.test(expected))
}

export function verifyExportPin(pin: string): boolean {
  const expected = process.env.NEXT_PUBLIC_EXPORT_PIN?.trim()
  if (!expected || !EXPORT_PIN_PATTERN.test(expected)) {
    return false
  }
  return pin === expected
}
