"use client"

import * as React from "react"

import { db, ensurePowerSyncInitialized } from "@/lib/db/powersync"
import { seedTicketPoolIfEmpty } from "@/lib/db/seedTicketPool"
import { createBikeParkConnector } from "@/lib/db/sync"
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

  React.useEffect(() => {
    getOrCreateDeviceUuid()
    let cancelled = false

    void (async () => {
      await ensurePowerSyncInitialized()
      const connector = createBikeParkConnector()
      const creds = await connector.fetchCredentials()
      if (creds && !db.connected) {
        await db.connect(connector)
      }
      await seedTicketPoolIfEmpty(db)
      if (!cancelled) {
        setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
        aria-busy="true"
      >
        Loading…
      </div>
    )
  }

  return (
    <PowerSyncReadyContext.Provider value={true}>{children}</PowerSyncReadyContext.Provider>
  )
}
