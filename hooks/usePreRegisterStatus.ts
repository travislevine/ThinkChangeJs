"use client"

import * as React from "react"

import type { PreRegisterStatusResponse } from "@/lib/types/preRegister"

export interface UsePreRegisterStatusResult {
  status: PreRegisterStatusResponse | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePreRegisterStatus(): UsePreRegisterStatusResult {
  const [status, setStatus] = React.useState<PreRegisterStatusResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/pre-register", { method: "GET" })
      if (!response.ok) {
        throw new Error("Could not load registration status.")
      }
      const data = (await response.json()) as PreRegisterStatusResponse
      setStatus(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load registration status.")
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { status, isLoading, error, refresh }
}
