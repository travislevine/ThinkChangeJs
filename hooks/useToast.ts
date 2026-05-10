"use client"

import { toast as sonnerToast } from "sonner"

import {
  TOAST_DURATION_DEFAULT_MS,
  TOAST_DURATION_ERROR_MS,
  TOAST_DURATION_SUCCESS_MS,
  TOAST_DURATION_WARNING_MS,
} from "@/lib/constants/toastDurations"
import type { AppToastOptions, UseToastResult } from "@/lib/types/toast"

const BOTTOM = "bottom-center" as const

function mergeOptions(defaultDuration: number, data?: AppToastOptions): AppToastOptions {
  return { duration: defaultDuration, position: BOTTOM, ...data }
}

export function useToast(): UseToastResult {
  return {
    toast: (message, data) => sonnerToast(message, mergeOptions(TOAST_DURATION_DEFAULT_MS, data)),
    success: (message, data) => sonnerToast.success(message, mergeOptions(TOAST_DURATION_SUCCESS_MS, data)),
    error: (message, data) => sonnerToast.error(message, mergeOptions(TOAST_DURATION_ERROR_MS, data)),
    info: (message, data) => sonnerToast.info(message, mergeOptions(TOAST_DURATION_DEFAULT_MS, data)),
    warning: (message, data) => sonnerToast.warning(message, mergeOptions(TOAST_DURATION_WARNING_MS, data)),
    dismiss: (id) => sonnerToast.dismiss(id),
  }
}
