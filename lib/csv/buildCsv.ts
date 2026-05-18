import type { ExportRow } from "@/lib/types/csvExport"

const CSV_HEADERS = [
  "Event Name",
  "Ticket Number",
  "Patron Name",
  "Patron Phone",
  "Status",
  "Check-In Time",
  "Check-Out Time",
  "Device Type(s)",
  "Device Quantity",
  "Device Colour(s)",
  "Notes",
] as const

const EXPORT_DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})

function escapeCsvField(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value)
  if (!needsQuotes) return value
  return `"${value.replace(/"/g, '""')}"`
}

function formatExportDateTime(iso: string | null): string {
  if (iso == null || !iso.trim()) return ""
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return ""
  return EXPORT_DATE_TIME_FORMAT.format(new Date(ms))
}

function rowToCells(row: ExportRow): string[] {
  return [
    row.eventName,
    String(row.ticketNumber),
    row.patronName,
    row.patronPhone,
    row.status,
    formatExportDateTime(row.checkInTime),
    formatExportDateTime(row.checkOutTime),
    row.deviceTypes,
    row.deviceQuantities,
    row.deviceColours,
    row.notes,
  ]
}

export function buildCsv(rows: ExportRow[]): string {
  const lines: string[] = [CSV_HEADERS.map(escapeCsvField).join(",")]
  for (const row of rows) {
    lines.push(rowToCells(row).map(escapeCsvField).join(","))
  }
  return lines.join("\r\n")
}

export function downloadCsv(csv: string, filename: string): void {
  if (typeof document === "undefined") {
    return
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.style.display = "none"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function buildExportFilename(eventName: string): string {
  const slug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const safeSlug = slug || "event"
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `bikepark-export-${safeSlug}-${yyyy}-${mm}-${dd}.csv`
}
