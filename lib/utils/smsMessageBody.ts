import { BIKEPARK_RATING_SURVEY_URL } from "@/lib/constants/sms"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import type { SmsMessageVariant, SmsPicksByType } from "@/lib/types/sendSms"
import { formatCheckTicketTimestamp } from "@/lib/utils/checkTicketFormat"
import { formatPickupDeviceBreakdown } from "@/lib/utils/formatPickupDeviceBreakdown"
import type { PickupTicketDeviceLine } from "@/lib/types/pickup"

function smsPatronGreeting(patronName: string | null): string {
  return patronName !== null && patronName.trim().length > 0
    ? patronName.trim()
    : "there"
}

function deviceTypeSortIndex(deviceType: string): number {
  const idx = (DEVICE_CATEGORIES as readonly string[]).indexOf(deviceType)
  return idx >= 0 ? idx : DEVICE_CATEGORIES.length
}

function normalizePicksByType(picksByType: SmsPicksByType): Array<{ deviceType: string; quantity: number }> {
  const entries: Array<{ deviceType: string; quantity: number }> = []
  for (const [deviceType, rawQty] of Object.entries(picksByType)) {
    const quantity = Math.max(0, Math.floor(Number(rawQty)))
    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue
    }
    const label = deviceType.trim() || "Other"
    entries.push({ deviceType: label, quantity })
  }
  entries.sort((a, b) => {
    const d = deviceTypeSortIndex(a.deviceType) - deviceTypeSortIndex(b.deviceType)
    if (d !== 0) {
      return d
    }
    return a.deviceType.localeCompare(b.deviceType)
  })
  return entries
}

function formatPickupQuantityPhrase(picksByType: SmsPicksByType): string {
  const picks = normalizePicksByType(picksByType)
  if (picks.length === 0) {
    return "your devices"
  }

  const parts = picks.map(
    ({ deviceType, quantity }) => `${quantity} of your ${deviceType}`
  )
  if (parts.length === 1) {
    return parts[0]
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`
  }
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
}

export interface BuildSmsMessageBodyParams {
  variant: SmsMessageVariant
  ticketNumber: number
  patronName: string | null
  checkedInAtSeconds?: number
  pickedUpAtSeconds?: number
  picksByType?: SmsPicksByType
  allDevicesPickedUp?: boolean
}

/** BikePark pre-registration confirmation SMS (public /pre-register form). */
export function buildBikeParkPreRegisteredSmsBody(
  patronName: string | null,
  deviceLines: PickupTicketDeviceLine[]
): string {
  const greeting = smsPatronGreeting(patronName)
  const breakdown = formatPickupDeviceBreakdown(deviceLines)
  const deviceLine = breakdown ? `Devices: ${breakdown}` : "Devices: see your registration"

  return [
    `Hi ${greeting}, you're pre-registered at BikePark.`,
    deviceLine,
    "Present your details at drop-off to receive your ticket number.",
  ].join("\n")
}

/** BikePark ready-for-collection SMS (Check Ticket manual send). */
export function buildBikeParkReadySmsBody(
  ticketNumber: number,
  patronName: string | null
): string {
  const greeting = smsPatronGreeting(patronName)

  return [
    `Hi ${greeting}, your items are ready for collection at BikePark.`,
    `Please present Ticket #${ticketNumber} to collect them.`,
  ].join("\n")
}

/** BikePark checked-in SMS (auto-send after blank drop-off). */
export function buildBikeParkCheckedInSmsBody(
  ticketNumber: number,
  patronName: string | null,
  checkedInAtSeconds: number
): string {
  const greeting = smsPatronGreeting(patronName)
  const checkedInAt = formatCheckTicketTimestamp(checkedInAtSeconds)

  return [
    `Hi ${greeting}, you're checked in at BikePark.`,
    `Checked in: ${checkedInAt}`,
    `Your ticket number is #${ticketNumber}.`,
  ].join("\n")
}

/** BikePark pick-up SMS (auto-send after Complete Pick-Up). */
export function buildBikeParkPickupSmsBody(
  patronName: string | null,
  pickedUpAtSeconds: number,
  picksByType: SmsPicksByType,
  allDevicesPickedUp: boolean
): string {
  const greeting = smsPatronGreeting(patronName)
  const pickedUpAt = formatCheckTicketTimestamp(pickedUpAtSeconds)
  const pickupSummary = formatPickupQuantityPhrase(picksByType)

  const lines = [
    `Hi ${greeting}, you have picked up ${pickupSummary} at BikePark.`,
    `Picked up: ${pickedUpAt}`,
  ]

  if (allDevicesPickedUp) {
    lines.push(
      `Thanks for using BikePark! Please rate your experience: ${BIKEPARK_RATING_SURVEY_URL}`
    )
  }

  return lines.join("\n")
}

export function buildSmsMessageBody(params: BuildSmsMessageBodyParams): string {
  const { variant, ticketNumber, patronName } = params

  if (variant === "checked_in") {
    if (params.checkedInAtSeconds === undefined || !Number.isFinite(params.checkedInAtSeconds)) {
      throw new Error("checkedInAt is required for checked-in SMS.")
    }
    return buildBikeParkCheckedInSmsBody(ticketNumber, patronName, params.checkedInAtSeconds)
  }

  if (variant === "pickup") {
    if (params.pickedUpAtSeconds === undefined || !Number.isFinite(params.pickedUpAtSeconds)) {
      throw new Error("pickedUpAt is required for pick-up SMS.")
    }
    if (!params.picksByType || normalizePicksByType(params.picksByType).length === 0) {
      throw new Error("picksByType is required for pick-up SMS.")
    }
    return buildBikeParkPickupSmsBody(
      patronName,
      params.pickedUpAtSeconds,
      params.picksByType,
      params.allDevicesPickedUp === true
    )
  }

  return buildBikeParkReadySmsBody(ticketNumber, patronName)
}
