/** Auto-note prefix when devices are added via Edit ticket (shown in Pick-up history, not Notes log). */
export const CHECK_TICKET_DEVICE_ADDED_NOTE_PREFIX = "📦 Devices added: "

/** Auto-note prefix when devices are removed via Edit ticket (shown in Notes log). */
export const CHECK_TICKET_DEVICE_REMOVED_NOTE_PREFIX = "📦 Devices removed: "

export function isCheckTicketDeviceAddedNote(content: string): boolean {
  return content.startsWith(CHECK_TICKET_DEVICE_ADDED_NOTE_PREFIX)
}

export function isCheckTicketDeviceRemovedNote(content: string): boolean {
  return content.startsWith(CHECK_TICKET_DEVICE_REMOVED_NOTE_PREFIX)
}
