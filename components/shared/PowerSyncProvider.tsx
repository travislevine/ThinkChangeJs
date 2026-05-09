"use client"

import * as React from "react"

export interface PowerSyncProviderProps {
  children: React.ReactNode
}

/**
 * Placeholder until Phase 0.8 — initialises PowerSync and exposes `db` via context.
 */
export function PowerSyncProvider({ children }: PowerSyncProviderProps) {
  return <>{children}</>
}
