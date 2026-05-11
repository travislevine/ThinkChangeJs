"use client"

import * as React from "react"

import { PowerSyncBootSkeleton } from "@/components/shared/PowerSyncBootSkeleton"
import {
  connectBikeParkPowerSync,
  db,
  ensurePowerSyncInitialized,
} from "@/lib/db/powersync"
import { consolidateDuplicateActiveEvents } from "@/lib/db/reconcileActiveEvents"
import { seedTicketPoolIfEmpty } from "@/lib/db/seedTicketPool"
import { getOrCreateDeviceUuid } from "@/lib/deviceUuid"

const PowerSyncReadyContext = React.createContext(false)

export function usePowerSyncReady(): boolean {
  return React.useContext(PowerSyncReadyContext)
}

export interface PowerSyncProviderProps {
  children: React.ReactNode
}

export function PowerSyncProvider({ children }: PowerSyncProviderProps) {
  const [ready, setReady] = React.useState(false)
  const [initError, setInitError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getOrCreateDeviceUuid()
    let cancelled = false

    void (async () => {
      try {
        await ensurePowerSyncInitialized()
      } catch (e) {
        if (cancelled) return
        const message =
          e instanceof Error
            ? e.message
            : "Offline database failed to initialize on this device/browser."
        setInitError(message)
        setReady(true)
        return
      }
      if (cancelled) return

      // Download first when credentials exist so we do not create a local-only "Default event"
      // + pool that later conflicts with server `events` (two `is_active = 1` → wrong `event_id` for lists).
      const syncResult = await connectBikeParkPowerSync()
      if (cancelled) return
      if (!syncResult.ok) {
        setInitError((prev) => prev ?? syncResult.error)
      } else if (db.connected) {
        try {
          const firstSync = new AbortController()
          const timeout = window.setTimeout(() => firstSync.abort(), 30_000)
          try {
            await db.waitForFirstSync(firstSync.signal)
          } finally {
            window.clearTimeout(timeout)
          }
        } catch {
          // Boot continues if the first download is slow; manual refresh can retry sync.
        }
      }

      await seedTicketPoolIfEmpty(db)
      if (cancelled) return
      await consolidateDuplicateActiveEvents(db)
      if (cancelled) return
      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <PowerSyncBootSkeleton />
  }

  if (initError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground shadow-sm">
          <div className="text-base font-semibold">Offline database unavailable</div>
          <p className="mt-2 text-muted-foreground">
            This usually happens when opening the dev server from a phone over your LAN using plain HTTP
            (for example, <span className="font-mono">http://192.168.x.x:3000</span>). Some browser
            APIs required by SQLite/PowerSync are restricted outside secure contexts.
          </p>
          <p className="mt-3 text-muted-foreground">
            Best fix: use HTTPS for the dev server, or test on the same machine using{" "}
            <span className="font-mono">http://localhost</span>.
          </p>
          <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
            {initError}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PowerSyncReadyContext.Provider value={true}>{children}</PowerSyncReadyContext.Provider>
  )
}
