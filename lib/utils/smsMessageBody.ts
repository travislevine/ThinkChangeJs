import type { SmsMessageVariant } from "@/lib/types/sendSms"
import { formatCheckTicketTimestamp } from "@/lib/utils/checkTicketFormat"

function smsPatronGreeting(patronName: string | null): string {
  return patronName !== null && patronName.trim().length > 0
    ? patronName.trim()
    : "there"
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

export function buildSmsMessageBody(
  variant: SmsMessageVariant,
  ticketNumber: number,
  patronName: string | null,
  checkedInAtSeconds?: number
): string {
  if (variant === "checked_in") {
    if (checkedInAtSeconds === undefined || !Number.isFinite(checkedInAtSeconds)) {
      throw new Error("checkedInAt is required for checked-in SMS.")
    }
    return buildBikeParkCheckedInSmsBody(ticketNumber, patronName, checkedInAtSeconds)
  }
  return buildBikeParkReadySmsBody(ticketNumber, patronName)
}
