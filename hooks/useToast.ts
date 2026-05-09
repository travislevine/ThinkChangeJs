"use client"

import { toast as sonnerToast } from "sonner"

import type { AppToastOptions, UseToastResult } from "@/lib/types/toast"

const BOTTOM = "bottom-center" as const

function mergeOptions(data?: AppToastOptions) {
  return { ...data, position: BOTTOM }
}

export function useToast(): UseToastResult {
  return {
    toast: (message, data) => sonnerToast(message, mergeOptions(data)),
    success: (message, data) => sonnerToast.success(message, mergeOptions(data)),
    error: (message, data) => sonnerToast.error(message, mergeOptions(data)),
    info: (message, data) => sonnerToast.info(message, mergeOptions(data)),
    warning: (message, data) => sonnerToast.warning(message, mergeOptions(data)),
    dismiss: (id) => sonnerToast.dismiss(id),
  }
}
