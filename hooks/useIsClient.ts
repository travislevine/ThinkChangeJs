"use client"

import * as React from "react"

function subscribe(): () => void {
  return () => {}
}

function getServerSnapshot(): boolean {
  return false
}

function getSnapshot(): boolean {
  return true
}

export function useIsClient(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

