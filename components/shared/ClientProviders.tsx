"use client"

import type { ReactNode } from "react"
import { SerwistProvider } from "@serwist/next/react"

import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { PowerSyncProvider } from "@/components/shared/PowerSyncProvider"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { UpdatePrompt } from "@/components/shared/UpdatePrompt"
import { EventProvider } from "@/contexts/EventContext"
import { SyncStatusProvider } from "@/contexts/SyncStatusContext"

export interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
      <ThemeProvider>
        <PowerSyncProvider>
          <EventProvider>
            <SyncStatusProvider>
              <AuthGuard>
                <UpdatePrompt />
                {children}
                <Toaster richColors position="bottom-center" />
              </AuthGuard>
            </SyncStatusProvider>
          </EventProvider>
        </PowerSyncProvider>
      </ThemeProvider>
    </SerwistProvider>
  )
}
