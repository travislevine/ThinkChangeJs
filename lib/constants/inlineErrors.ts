/** Shown next to save actions when a local DB / PowerSync write fails unexpectedly (Phase 5.4). */
export const INLINE_POWER_SYNC_SAVE_FAILED = "Failed to save. Please try again." as const

const DROP_OFF_KNOWN: readonly string[] = [
  "No active event.",
  "Ticket number is invalid.",
  "Ticket number not found in pool.",
]

/** Prefer a specific drop-off message when the error is a known rule; otherwise use the generic save line. */
export function inlineMessageForDropOffWrite(e: unknown): string {
  const msg = e instanceof Error ? e.message : ""
  if (DROP_OFF_KNOWN.some((k) => msg.startsWith(k))) {
    return msg
  }
  if (/already in use/i.test(msg)) {
    return msg
  }
  return INLINE_POWER_SYNC_SAVE_FAILED
}

const PICKUP_KNOWN: readonly string[] = [
  "Select at least one device to pick up.",
  "Ticket not found.",
  "Ticket does not belong to this event.",
  "This ticket is not active for pick-up.",
  "Total pick-up exceeds devices remaining on this ticket.",
]

export function inlineMessageForPickupWrite(e: unknown): string {
  const msg = e instanceof Error ? e.message : ""
  if (PICKUP_KNOWN.includes(msg)) {
    return msg
  }
  return INLINE_POWER_SYNC_SAVE_FAILED
}
