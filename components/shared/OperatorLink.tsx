"use client"

import Link from "next/link"
import * as React from "react"

import { isOfflineForNavigation } from "@/lib/navigation/isOfflineForNavigation"

export type OperatorLinkProps = React.ComponentProps<typeof Link>

/**
 * Uses Next.js client navigation when online; native navigation when offline so
 * the service worker can serve precached HTML (required on iOS WebKit).
 */
export const OperatorLink = React.forwardRef<HTMLAnchorElement, OperatorLinkProps>(
  function OperatorLink({ href, prefetch, replace, scroll, ...rest }, ref) {
    const offline = isOfflineForNavigation()

    if (offline) {
      const path = typeof href === "string" ? href : href.pathname ?? "/"
      return <a ref={ref} href={path} {...rest} />
    }

    return (
      <Link
        ref={ref}
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        {...rest}
      />
    )
  }
)

OperatorLink.displayName = "OperatorLink"
