"use client"

import * as React from "react"

import { useToast } from "@/hooks/useToast"

export interface UseExportCsvResult {
  triggerExport: () => Promise<void>
  isExporting: boolean
}

export function useExportCsv(eventId: string, eventName: string): UseExportCsvResult {
  const { success, error: toastError } = useToast()
  const [isExporting, setIsExporting] = React.useState(false)
  const inFlightRef = React.useRef(false)

  const triggerExport = React.useCallback(async (): Promise<void> => {
    if (!eventId.trim()) {
      toastError("Select an event before exporting.")
      return
    }
    if (inFlightRef.current) {
      return
    }

    inFlightRef.current = true
    setIsExporting(true)

    try {
      const [{ fetchExportData }, { buildCsv, buildExportFilename, downloadCsv }] = await Promise.all([
        import("@/lib/csv/fetchExportData"),
        import("@/lib/csv/buildCsv"),
      ])
      const rows = await fetchExportData(eventId)
      const csv = buildCsv(rows)
      downloadCsv(csv, buildExportFilename(eventName))
      success("CSV exported successfully")
    } catch (e) {
      console.error("[BikePark] CSV export failed:", e)
      toastError("Export failed — check your connection and try again")
    } finally {
      inFlightRef.current = false
      setIsExporting(false)
    }
  }, [eventId, eventName, success, toastError])

  return { triggerExport, isExporting }
}
