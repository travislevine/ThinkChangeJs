"use client"

import * as React from "react"

import { useEvent } from "@/contexts/EventContext"
import { db } from "@/lib/db/powersync"
import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"

const DUMMY_PATRONS = [
  { name: "Alex Rider", mobile: "0412345678", email: "alex@dummy.bikepark" },
  { name: "Sam Taylor", mobile: "0498765432", email: "sam@dummy.bikepark" },
  { name: "Jamie Chen", mobile: "0400111222", email: "jamie@dummy.bikepark" },
  { name: "Casey Patel", mobile: "0422333444", email: "casey@dummy.bikepark" },
  { name: "Morgan Lee", mobile: "0433555666", email: "morgan@dummy.bikepark" },
  { name: "Jordan Nguyen", mobile: "0444777888", email: "jordan@dummy.bikepark" },
  { name: "Riley Smith", mobile: "0455999000", email: "riley@dummy.bikepark" },
  { name: "Taylor Brown", mobile: "0466123456", email: "taylor@dummy.bikepark" },
] as const

const TARGET_COUNT = 8

export function useSeedDummyPreRegistered(): void {
  const { currentEvent } = useEvent()
  const eventId = currentEvent?.id ?? null

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (!eventId) return

    let cancelled = false
    void (async () => {
      const countRow = await db.getOptional<{ c: number | string }>(
        "SELECT COUNT(*) as c FROM tickets WHERE event_id = ? AND status = 'pre_registered' AND deleted_at IS NULL AND email LIKE '%@dummy.bikepark'",
        [eventId]
      )
      const count = Number(countRow?.c ?? 0)
      if (!Number.isFinite(count) || count >= TARGET_COUNT) return

      await db.writeTransaction(async (tx) => {
        const needed = Math.max(0, TARGET_COUNT - count)
        if (needed === 0) return

        const available = await tx.getAll<{ id: string; number: number | string }>(
          "SELECT id, number FROM ticket_numbers WHERE event_id = ? AND status = 'available' ORDER BY number ASC LIMIT 50",
          [eventId]
        )
        const numbers = available.map((r) => Number(r.number)).filter((n) => Number.isFinite(n))

        for (const patron of DUMMY_PATRONS.slice(0, needed)) {
          if (cancelled) return
          const ticketId = crypto.randomUUID()
          const ticketNumber = numbers.shift() ?? Math.floor(100 + Math.random() * 800)
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

