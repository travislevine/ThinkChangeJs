"use client"

import * as React from "react"

import { PowerSyncBootSkeleton } from "@/components/shared/PowerSyncBootSkeleton"
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
      if (cancelled) return
      await seedTicketPoolIfEmpty(db)
      if (cancelled) return
      setReady(true)

      void (async () => {
        const connector = createBikeParkConnector()
        const creds = await connector.fetchCredentials()
        if (cancelled || !creds || db.connected || db.connecting) return
        await db.connect(connector)
      })()
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <PowerSyncBootSkeleton />
  }

  return (
    <PowerSyncReadyContext.Provider value={true}>{children}</PowerSyncReadyContext.Provider>
  )
}
