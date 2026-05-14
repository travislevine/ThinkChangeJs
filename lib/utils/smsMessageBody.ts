/** Same wording as `POST /api/send-sms` (BikePark ready-for-collection SMS). */
export function buildBikeParkReadySmsBody(
  ticketNumber: number,
  patronName: string | null
): string {
  const greeting =
    patronName !== null && patronName.trim().length > 0
      ? patronName.trim()
      : "there"

  return [
    `Hi ${greeting}, your items are ready for collection at BikePark.`,
    `Please present Ticket #${ticketNumber} to collect them.`,
  ].join("\n")
}
