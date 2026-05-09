"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"
import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"

const DUMMY_PATRONS = [
  { name: "Alex Rider", mobile: "0412345678", email: "alex@example.com" },
  { name: "Sam Taylor", mobile: "0498765432", email: "sam@example.com" },
  { name: "Jamie Chen", mobile: "0400111222", email: "jamie@example.com" },
  { name: "Casey Patel", mobile: "0422333444", email: "casey@example.com" },
  { name: "Morgan Lee", mobile: "0433555666", email: "morgan@example.com" },
  { name: "Jordan Nguyen", mobile: "0444777888", email: "jordan@example.com" },
  { name: "Riley Smith", mobile: "0455999000", email: "riley@example.com" },
  { name: "Taylor Brown", mobile: "0466123456", email: "taylor@example.com" },
] as const

export function useSeedDummyPreRegistered(): void {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (!eventId) return

    let cancelled = false
    void (async () => {
      const countRow = await db.getOptional<{ c: number | string }>(
        "SELECT COUNT(*) as c FROM tickets WHERE event_id = ? AND status = 'pre_registered' AND deleted_at IS NULL",
        [eventId]
      )
      const count = Number(countRow?.c ?? 0)
      if (!Number.isFinite(count) || count > 0) return

      await db.writeTransaction(async (tx) => {
        for (const patron of DUMMY_PATRONS) {
          if (cancelled) return
          const ticketId = crypto.randomUUID()
          const ticketNumber = Math.floor(100 + Math.random() * 800)
          const qty = 1 + Math.floor(Math.random() * 2)

          await tx.execute(
            "INSERT INTO tickets (id, event_id, ticket_number, patron_name, mobile, email, total_devices, devices_remaining, status, deleted_at, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pre_registered', NULL, NULL)",
            [ticketId, eventId, ticketNumber, patron.name, patron.mobile, patron.email, qty, qty]
          )

          await tx.execute(
            "INSERT INTO devices (id, ticket_id, device_type, quantity, colour) VALUES (?, ?, ?, ?, ?)",
            [
              crypto.randomUUID(),
              ticketId,
              DEVICE_CATEGORIES[Math.floor(Math.random() * DEVICE_CATEGORIES.length)],
              qty,
              COLOURS[Math.floor(Math.random() * COLOURS.length)],
            ]
          )
        }
      })
    })()

    return () => {
      cancelled = true
    }
  }, [eventId])
}

