"use client"

import * as React from "react"

import {
  BREAKPOINT_MIN_PX,
  type BreakpointName,
} from "@/lib/constants/layout"

function breakpointFromWidth(width: number): BreakpointName {
  if (width >= BREAKPOINT_MIN_PX.xl) return "xl"
  if (width >= BREAKPOINT_MIN_PX.lg) return "lg"
  if (width >= BREAKPOINT_MIN_PX.md) return "md"
  if (width >= BREAKPOINT_MIN_PX.sm) return "sm"
  return "xs"
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange)
  return () => window.removeEventListener("resize", onStoreChange)
}

function getSnapshot(): BreakpointName {
  return breakpointFromWidth(window.innerWidth)
}

function getServerSnapshot(): BreakpointName {
  return "sm"
}

export function useBreakpoint(): BreakpointName {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
