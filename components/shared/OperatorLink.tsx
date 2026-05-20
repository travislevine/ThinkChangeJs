"use client"

import Link from "next/link"
import * as React from "react"

import { useOfflineForNavigation } from "@/hooks/useOfflineForNavigation"

export type OperatorLinkProps = React.ComponentProps<typeof Link>

/**
 * Next.js client navigation when online; full page load when offline (PWA / airplane mode).
 */
export const OperatorLink = React.forwardRef<HTMLAnchorElement, OperatorLinkProps>(
  function OperatorLink({ href, prefetch, replace, scroll, ...rest }, ref) {
    const offline = useOfflineForNavigation()

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
