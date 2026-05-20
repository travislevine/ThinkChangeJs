"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { shouldUseDocumentNavigation } from "@/lib/navigation/shouldUseDocumentNavigation"

/**
 * Full document navigation in installed PWA / offline; client router in a browser tab online.
 */
export function operatorNavigate(router: AppRouterInstance, href: string): void {
  if (shouldUseDocumentNavigation()) {
    window.location.assign(href)
    return
  }
  router.push(href)
}

export function operatorReplace(router: AppRouterInstance, href: string): void {
  if (shouldUseDocumentNavigation()) {
    window.location.replace(href)
    return
  }
  router.replace(href)
}
