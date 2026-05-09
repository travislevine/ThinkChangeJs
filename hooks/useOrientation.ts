"use client"

import * as React from "react"

export type Orientation = "portrait" | "landscape"

const PORTRAIT_QUERY = "(orientation: portrait)"

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(PORTRAIT_QUERY)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getSnapshot(): Orientation {
  return window.matchMedia(PORTRAIT_QUERY).matches ? "portrait" : "landscape"
}

function getServerSnapshot(): Orientation {
  return "landscape"
}

export function useOrientation(): Orientation {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
