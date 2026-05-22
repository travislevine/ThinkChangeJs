"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { shouldUseDocumentNavigation } from "@/lib/navigation/shouldUseDocumentNavigation"

/**
 * Document navigation when offline, or installed Android PWA; client router in browser / iOS PWA online.
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
