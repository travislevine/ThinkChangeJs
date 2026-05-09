"use client"

import * as React from "react"

import {
  PIN_HASH_STORAGE_KEY,
  PIN_SESSION_STORAGE_KEY,
  PIN_SESSION_VALUE_OK,
} from "@/lib/constants/pinAuth"
import { sha256Hex } from "@/lib/crypto/sha256Hex"

export interface PinAuthContextValue {
  ready: boolean
  isAuthorised: boolean
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
}

const PinAuthContext = React.createContext<PinAuthContextValue | null>(null)

function readSessionAuthorised(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(PIN_SESSION_STORAGE_KEY) === PIN_SESSION_VALUE_OK
}

export function PinAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [isAuthorised, setIsAuthorised] = React.useState(false)

  React.useEffect(() => {
    void (async () => {
      const envPin = process.env.NEXT_PUBLIC_APP_PIN
      if (envPin && !localStorage.getItem(PIN_HASH_STORAGE_KEY)) {
        const hash = await sha256Hex(envPin)
        localStorage.setItem(PIN_HASH_STORAGE_KEY, hash)
      }
      setIsAuthorised(readSessionAuthorised())
      setReady(true)
    })()
  }, [])

  const unlock = React.useCallback(async (pin: string): Promise<boolean> => {
    const nextHash = await sha256Hex(pin)
    const stored = localStorage.getItem(PIN_HASH_STORAGE_KEY)

    if (!stored) {
      localStorage.setItem(PIN_HASH_STORAGE_KEY, nextHash)
      sessionStorage.setItem(PIN_SESSION_STORAGE_KEY, PIN_SESSION_VALUE_OK)
      setIsAuthorised(true)
      return true
    }

    if (nextHash !== stored) {
      return false
    }

    sessionStorage.setItem(PIN_SESSION_STORAGE_KEY, PIN_SESSION_VALUE_OK)
    setIsAuthorised(true)
    return true
  }, [])

  const lock = React.useCallback(() => {
    sessionStorage.removeItem(PIN_SESSION_STORAGE_KEY)
    setIsAuthorised(false)
  }, [])

  const value = React.useMemo<PinAuthContextValue>(
    () => ({
      ready,
      isAuthorised,
      unlock,
      lock,
    }),
    [ready, isAuthorised, unlock, lock]
  )

  return <PinAuthContext.Provider value={value}>{children}</PinAuthContext.Provider>
}

export function usePinAuth(): PinAuthContextValue {
  const ctx = React.useContext(PinAuthContext)
  if (!ctx) {
    throw new Error("usePinAuth must be used within PinAuthProvider")
  }
  return ctx
}
