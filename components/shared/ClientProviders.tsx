"use client"

import * as React from "react"
import type { ReactNode } from "react"
import { SerwistProvider } from "@serwist/next/react"

import { AuthGuard } from "@/components/shared/AuthGuard"
import { PowerSyncProvider } from "@/components/shared/PowerSyncProvider"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { UpdatePrompt } from "@/components/shared/UpdatePrompt"
import { TooltipProvider } from "@/components/ui/tooltip"
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

function DevUnhandledRejectionLogger() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as unknown
      const err =
        reason instanceof Error ? reason : new Error(typeof reason === "string" ? reason : "Unhandled rejection")
      console.error("[dev] unhandledrejection", err, err.stack)
    }

    const onError = (event: ErrorEvent) => {
      console.error("[dev] error", event.error ?? event.message)
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection)
    window.addEventListener("error", onError)
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
      window.removeEventListener("error", onError)
    }
  }, [])

  return null
}

export function ClientProviders({ children, toast }: ClientProvidersProps) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <PowerSyncProvider>
            <EventProvider>
              <SyncStatusProvider>
                <PinAuthProvider>
                  <AuthGuard>
                    <DevServiceWorkerCleanup />
                    <DevUnhandledRejectionLogger />
                    <UpdatePrompt />
                    {children}
                  </AuthGuard>
                </PinAuthProvider>
              </SyncStatusProvider>
            </EventProvider>
          </PowerSyncProvider>
          {toast}
        </TooltipProvider>
      </ThemeProvider>
    </SerwistProvider>
  )
}

ClientProviders.displayName = "ClientProviders"
