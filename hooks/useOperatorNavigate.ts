"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { isOfflineForNavigation } from "@/lib/navigation/isOfflineForNavigation"

/**
 * Client router navigation when online; full document load when offline (iOS / PWA).
 */
export function operatorNavigate(router: AppRouterInstance, href: string): void {
  if (isOfflineForNavigation()) {
    window.location.assign(href)
    return
  }
  router.push(href)
}

export function operatorReplace(router: AppRouterInstance, href: string): void {
  if (isOfflineForNavigation()) {
    window.location.replace(href)
    return
  }
  router.replace(href)
}
