"use client"

import * as React from "react"
import type { ReactNode } from "react"
import { SerwistProvider } from "@serwist/next/react"

import { AuthGuard } from "@/components/shared/AuthGuard"
import { PowerSyncProvider } from "@/components/shared/PowerSyncProvider"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { UpdatePrompt } from "@/components/shared/UpdatePrompt"
import { EventProvider } from "@/contexts/EventContext"
import { SyncStatusProvider } from "@/contexts/SyncStatusContext"
import { PinAuthProvider } from "@/hooks/usePinAuth"

export interface ClientProvidersProps {
  children: ReactNode
  /** Renders inside `ThemeProvider` after the app tree (Sonner host from `app/layout.tsx`). */
  toast?: ReactNode
}

function DevServiceWorkerCleanup() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (!("serviceWorker" in navigator)) return

    void (async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    })()
  }, [])

  return null
}

export function ClientProviders({ children, toast }: ClientProvidersProps) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
      <ThemeProvider>
        <PowerSyncProvider>
          <EventProvider>
            <SyncStatusProvider>
              <PinAuthProvider>
                <AuthGuard>
                  <DevServiceWorkerCleanup />
                  <UpdatePrompt />
                  {children}
                </AuthGuard>
              </PinAuthProvider>
            </SyncStatusProvider>
          </EventProvider>
        </PowerSyncProvider>
        {toast}
      </ThemeProvider>
    </SerwistProvider>
  )
}

ClientProviders.displayName = "ClientProviders"
