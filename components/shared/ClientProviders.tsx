"use client"

import * as React from "react"
import { SerwistProvider } from "@serwist/next/react"

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { UpdatePrompt } from "@/components/shared/UpdatePrompt"

export interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
      <ThemeProvider>
        <UpdatePrompt />
        {children}
        <Toaster richColors position="bottom-center" />
      </ThemeProvider>
    </SerwistProvider>
  )
}

