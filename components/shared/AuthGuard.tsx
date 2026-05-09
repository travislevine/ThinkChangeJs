"use client"

import * as React from "react"

export interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Phase 0.7 — redirects unauthenticated users to `/pin`.
 * For now passes children through so routes remain testable.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>
}
