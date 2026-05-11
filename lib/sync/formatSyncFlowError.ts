/**
 * PowerSync may attach `downloadError` / `uploadError` as real `Error` instances or as
 * plain objects (e.g. `{ name, message, stack }` after worker/message-port serialization).
 */
export function formatSyncFlowError(value: unknown): string {
  if (value == null) {
    return ""
  }
  if (typeof value === "string") {
    return value
  }
  if (value instanceof Error) {
    return value.stack?.split("\n")[0]?.trim() || value.message || value.name || "Error"
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name : "Error"
    const message = typeof o.message === "string" ? o.message : ""
    if (message) {
      return name && name !== "Error" ? `${name}: ${message}` : message
    }
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
