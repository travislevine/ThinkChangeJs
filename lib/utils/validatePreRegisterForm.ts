import { COLOURS, type Colour } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES, type DeviceCategory } from "@/lib/constants/deviceCategories"
import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import type { PreRegisterDeviceInput } from "@/lib/types/preRegister"
import { validateDeviceRows } from "@/lib/utils/deviceRowValidation"
import { normaliseAuMobileForStorage } from "@/lib/utils/normaliseAuMobile"

export interface PreRegisterFormErrors {
  patronName?: string
  mobile?: string
  email?: string
  devices?: string
}

function isDeviceCategory(value: string): value is DeviceCategory {
  return (DEVICE_CATEGORIES as readonly string[]).includes(value)
}

function isColour(value: string): value is Colour {
  return (COLOURS as readonly string[]).includes(value)
}

export function validatePreRegisterPatronName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return "Enter your name."
  }
  if (!/^[A-Za-z ]+$/.test(trimmed)) {
    return "Use letters A–Z only."
  }
  return null
}

export function validatePreRegisterMobile(mobile: string): string | null {
  const trimmed = mobile.trim()
  if (!trimmed) {
    return null
  }
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length > 10) {
    return "Mobile number must be at most 10 digits."
  }
  if (normaliseAuMobileForStorage(trimmed) === null) {
    return "Enter a valid 10-digit mobile number starting with 0."
  }
  return null
}

export function validatePreRegisterEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return null
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address."
  }
  return null
}

export function validatePreRegisterDevices(devices: DropOffDeviceRow[]): string | null {
  return validateDeviceRows(devices)
}

export function validatePreRegisterForm(input: {
  patronName: string
  mobile: string
  email: string
  devices: DropOffDeviceRow[]
}): PreRegisterFormErrors {
  const errors: PreRegisterFormErrors = {}

  const nameError = validatePreRegisterPatronName(input.patronName)
  if (nameError) {
    errors.patronName = nameError
  }

  const mobileError = validatePreRegisterMobile(input.mobile)
  if (mobileError) {
    errors.mobile = mobileError
  }

  const emailError = validatePreRegisterEmail(input.email)
  if (emailError) {
    errors.email = emailError
  }

  const devicesError = validatePreRegisterDevices(input.devices)
  if (devicesError) {
    errors.devices = devicesError
  }

  return errors
}

export function parsePreRegisterDevices(
  raw: unknown
): { ok: true; devices: PreRegisterDeviceInput[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "Add at least one device." }
  }

  const devices: PreRegisterDeviceInput[] = []
  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Invalid device data." }
    }
    const record = item as Record<string, unknown>
    const deviceType = record.deviceType
    const colour = record.colour
    if (typeof deviceType !== "string" || !isDeviceCategory(deviceType)) {
      return { ok: false, error: "Invalid device type." }
    }
    if (typeof colour !== "string" || !isColour(colour)) {
      return { ok: false, error: "Invalid device colour." }
    }
    devices.push({ deviceType, colour })
  }

  if (devices.length > 6) {
    return { ok: false, error: "Reduce to at most 6 devices." }
  }

  return { ok: true, devices }
}
