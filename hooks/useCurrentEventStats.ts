"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"
import { DEVICE_CATEGORIES, type DeviceCategory } from "@/lib/constants/deviceCategories"
import type { CurrentEventStats, CurrentEventStatsResult } from "@/lib/types/stats"

type TotalsRow = { total_dropped_off: number | string | null; devices_remaining: number | string | null }
type CategoryRow = { device_type: string; dropped_off: number | string | null; picked_up: number | string | null }

const TOTALS_SQL = `
  SELECT
    COALESCE(SUM(total_devices), 0) AS total_dropped_off,
    COALESCE(SUM(devices_remaining), 0) AS devices_remaining
  FROM tickets
  WHERE event_id = ?
    AND deleted_at IS NULL
`

const BY_DEVICE_TYPE_SQL = `
  WITH dropped AS (
    SELECT d.device_type AS device_type, COALESCE(SUM(d.quantity), 0) AS dropped_off
    FROM devices d
    INNER JOIN tickets t ON t.id = d.ticket_id
    WHERE t.event_id = ?
      AND t.deleted_at IS NULL
    GROUP BY d.device_type
  ),
  picked AS (
    SELECT ped.device_type AS device_type, COALESCE(SUM(ped.quantity), 0) AS picked_up
    FROM pickup_event_devices ped
    INNER JOIN pickup_events pe ON pe.id = ped.pickup_event_id
    INNER JOIN tickets t ON t.id = pe.ticket_id
    WHERE t.event_id = ?
      AND t.deleted_at IS NULL
    GROUP BY ped.device_type
  )
  SELECT
    dropped.device_type AS device_type,
    dropped.dropped_off AS dropped_off,
    COALESCE(picked.picked_up, 0) AS picked_up
  FROM dropped
  LEFT JOIN picked ON picked.device_type = dropped.device_type
  UNION ALL
  SELECT
    picked.device_type AS device_type,
    0 AS dropped_off,
    picked.picked_up AS picked_up
  FROM picked
  LEFT JOIN dropped ON dropped.device_type = picked.device_type
  WHERE dropped.device_type IS NULL
`

function asInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function toCategory(deviceType: string): DeviceCategory {
  if ((DEVICE_CATEGORIES as readonly string[]).includes(deviceType)) {
    return deviceType as DeviceCategory
  }
  return "Other"
}

function emptyStats(): CurrentEventStats {
  return {
    totalDroppedOff: 0,
    devicesRemaining: 0,
    byCategory: DEVICE_CATEGORIES.map((category) => ({ category, droppedOff: 0, remaining: 0 })),
  }
}

export function useCurrentEventStats(): CurrentEventStatsResult {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null

  const [result, setResult] = React.useState<CurrentEventStatsResult>(() => ({
    stats: null,
    isLoading: false,
    error: null,
  }))

  React.useEffect(() => {
    if (!eventId) {
      return
    }

    const ac = new AbortController()

    const totals: { totalDroppedOff: number; devicesRemaining: number } = {
      totalDroppedOff: 0,
      devicesRemaining: 0,
    }
    const byCategory = new Map<DeviceCategory, { droppedOff: number; remaining: number }>(
      DEVICE_CATEGORIES.map((c) => [c, { droppedOff: 0, remaining: 0 }])
    )

    const emit = (): void => {
      const stats: CurrentEventStats = {
        totalDroppedOff: totals.totalDroppedOff,
        devicesRemaining: totals.devicesRemaining,
        byCategory: DEVICE_CATEGORIES.map((category) => {
          const row = byCategory.get(category) ?? { droppedOff: 0, remaining: 0 }
          return { category, droppedOff: row.droppedOff, remaining: row.remaining }
        }),
      }
      setResult({ stats, isLoading: false, error: null })
    }

    db.watch(
      TOTALS_SQL,
      [eventId],
      {
        onResult: (qr) => {
          const row = (qr.rows?.item(0) as TotalsRow | undefined) ?? undefined
          totals.totalDroppedOff = asInt(row?.total_dropped_off)
          totals.devicesRemaining = asInt(row?.devices_remaining)
          emit()
        },
        onError: (e) => {
          setResult({ stats: emptyStats(), isLoading: false, error: e.message })
        },
      },
      { signal: ac.signal }
    )

    db.watch(
      BY_DEVICE_TYPE_SQL,
      [eventId, eventId],
      {
        onResult: (qr) => {
          const next = new Map<DeviceCategory, { droppedOff: number; remaining: number }>(
            DEVICE_CATEGORIES.map((c) => [c, { droppedOff: 0, remaining: 0 }])
          )

          const rows = (qr.rows?._array ?? []) as unknown[]
          for (const r of rows) {
            const row = r as CategoryRow
            const category = toCategory(String(row.device_type ?? "Other"))
            const droppedOff = asInt(row.dropped_off)
            const pickedUp = asInt(row.picked_up)
            const remaining = Math.max(0, droppedOff - pickedUp)

            const prev = next.get(category) ?? { droppedOff: 0, remaining: 0 }
            next.set(category, {
              droppedOff: prev.droppedOff + droppedOff,
              remaining: prev.remaining + remaining,
            })
          }

          for (const [k, v] of next) {
            byCategory.set(k, v)
          }
          emit()
        },
        onError: (e) => {
          setResult({ stats: emptyStats(), isLoading: false, error: e.message })
        },
      },
      { signal: ac.signal }
    )

    return () => ac.abort()
  }, [eventId])

  if (!eventId) {
    return { stats: null, isLoading: false, error: null }
  }

  return result.stats ? result : { ...result, isLoading: true, error: null }
}

