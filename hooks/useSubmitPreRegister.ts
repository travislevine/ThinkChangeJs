"use client"

import * as React from "react"

import type { DropOffDeviceRow } from "@/lib/types/dropOffForm"
import type { PreRegisterSubmitSuccessResponse } from "@/lib/types/preRegister"

export interface SubmitPreRegisterInput {
  patronName: string
  mobile: string
  email: string
  devices: DropOffDeviceRow[]
  notes: string
}

export interface SubmitPreRegisterResult {
  success: true
  smsSent: boolean
}

export interface UseSubmitPreRegisterResult {
  submit: (input: SubmitPreRegisterInput) => Promise<SubmitPreRegisterResult>
  isSubmitting: boolean
  error: string | null
  clearError: () => void
}

export function useSubmitPreRegister(): UseSubmitPreRegisterResult {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const submit = React.useCallback(async (input: SubmitPreRegisterInput): Promise<SubmitPreRegisterResult> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patronName: input.patronName,
          mobile: input.mobile.trim() || undefined,
          email: input.email.trim() || undefined,
          notes: input.notes.trim() || undefined,
          devices: input.devices.map((row) => ({
            deviceType: row.deviceType,
            colour: row.colour,
          })),
        }),
      })

      const data = (await response.json()) as { error?: string } & Partial<PreRegisterSubmitSuccessResponse>

      if (!response.ok) {
        throw new Error(data.error ?? "Registration failed. Please try again.")
      }

      return { success: true, smsSent: data.smsSent === true }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Registration failed. Please try again."
      setError(message)
      throw e
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return { submit, isSubmitting, error, clearError }
}
