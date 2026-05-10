"use client"

import { Toaster } from "@/components/ui/sonner"
import { TOAST_DURATION_DEFAULT_MS } from "@/lib/constants/toastDurations"

/** Sonner host for the app shell; must render under `ThemeProvider` (see `ClientProviders`). */
export function ToastMount() {
  return (
    <Toaster
      richColors
      position="bottom-center"
      closeButton
      toastOptions={{
        duration: TOAST_DURATION_DEFAULT_MS,
      }}
    />
  )
}

ToastMount.displayName = "ToastMount"
