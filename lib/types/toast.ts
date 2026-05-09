import type { ReactNode } from "react"
import type { ExternalToast } from "sonner"

export type AppToastMessage = ReactNode

export type AppToastOptions = Omit<ExternalToast, "position"> & {
  position?: ExternalToast["position"]
}

export type ToastId = string | number

export interface UseToastResult {
  toast: (message: AppToastMessage, data?: AppToastOptions) => ToastId
  success: (message: AppToastMessage, data?: AppToastOptions) => ToastId
  error: (message: AppToastMessage, data?: AppToastOptions) => ToastId
  info: (message: AppToastMessage, data?: AppToastOptions) => ToastId
  warning: (message: AppToastMessage, data?: AppToastOptions) => ToastId
  dismiss: (id?: string | number) => void
}
