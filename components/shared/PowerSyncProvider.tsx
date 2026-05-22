"use client"

import * as React from "react"

import { PowerSyncBootSkeleton } from "@/components/shared/PowerSyncBootSkeleton"
import { Button } from "@/components/ui/button"
import {
  connectBikeParkPowerSync,
  ensurePowerSyncInitialized,
  getDb,
  resetPowerSyncInit,
} from "@/lib/db/powersync"
import { consolidateDuplicateActiveEvents } from "@/lib/db/reconcileActiveEvents"
import { seedTicketPoolIfEmpty } from "@/lib/db/seedTicketPool"
import { getOrCreateDeviceUuid } from "@/lib/deviceUuid"
import { isAppleWebKit } from "@/lib/platform/isAppleWebKit"
import { waitForCloudBeforePoolSeed } from "@/lib/sync/waitForCloudBeforePoolSeed"

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
  const [retryCount, setRetryCount] = React.useState(0)

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

      // Show the UI as soon as the local DB is open — cloud sync continues in the background.
      setInitError(null)
      setReady(true)

      const database = getDb()

      void (async () => {
        const syncResult = await connectBikeParkPowerSync()
        if (cancelled) return

        if (syncResult.ok && database.connected) {
          await waitForCloudBeforePoolSeed(database)
        }

        if (cancelled) return
        await seedTicketPoolIfEmpty(database)
        if (cancelled) return

        const runConsolidate = (): void => {
          if (!cancelled) {
            void consolidateDuplicateActiveEvents(database)
          }
        }
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(runConsolidate)
        } else {
          window.setTimeout(runConsolidate, 3_000)
        }
      })()
    })()

    return () => {
      cancelled = true
    }
  }, [retryCount])

  if (!ready) {
    return <PowerSyncBootSkeleton />
  }

  if (initError) {
    const onSecureOrigin =
      typeof window !== "undefined" && window.isSecureContext === true

    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground shadow-sm">
          <div className="text-base font-semibold">Offline database unavailable</div>
          {onSecureOrigin ? (
            <p className="mt-2 text-muted-foreground">
              BikePark could not open its local database on this device
              {isAppleWebKit() ? " (iPhone/iPad)" : ""}. This is often caused by low storage,
              a private browsing session, or a stale site cache after an update.
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              This page must be opened over HTTPS. Plain HTTP (for example a LAN dev URL like{" "}
              <span className="font-mono">http://192.168.x.x:3000</span>) blocks the SQLite APIs
              PowerSync needs.
            </p>
          )}
          <p className="mt-3 text-muted-foreground">
            Try closing other tabs, freeing storage, then tap Retry. If it still fails, clear this
            site&apos;s data in Safari settings or remove and re-add the home-screen icon.
          </p>
          <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground break-words">
            {initError}
          </div>
          <Button
            type="button"
            className="mt-4 min-h-[44px] w-full"
            onClick={() => {
              resetPowerSyncInit()
              setInitError(null)
              setReady(false)
              setRetryCount((n) => n + 1)
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PowerSyncReadyContext.Provider value={true}>{children}</PowerSyncReadyContext.Provider>
  )
}

PowerSyncProvider.displayName = "PowerSyncProvider"
