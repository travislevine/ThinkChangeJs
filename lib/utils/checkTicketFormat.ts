export function formatCheckTicketTimestamp(recordedAtSeconds: number): string {
  const ms = Math.max(0, Math.floor(recordedAtSeconds)) * 1000
  return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(
    new Date(ms)
  )
}
