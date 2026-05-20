"use client"

import * as React from "react"

import { shouldUseDocumentNavigation } from "@/lib/navigation/shouldUseDocumentNavigation"

/** Reactive flag for operator link / router navigation mode. */
export function useDocumentNavigation(): boolean {
  const [useDocument, setUseDocument] = React.useState(() => shouldUseDocumentNavigation())

  React.useEffect(() => {
    const sync = (): void => {
      setUseDocument(shouldUseDocumentNavigation())
    }

    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])

  return useDocument
}
