"use client"

import Link from "next/link"
import * as React from "react"

import { useDocumentNavigation } from "@/hooks/useDocumentNavigation"

export type OperatorLinkProps = React.ComponentProps<typeof Link>

function hrefToPath(href: OperatorLinkProps["href"]): string {
  if (typeof href === "string") {
    return href
  }
  return href.pathname ?? "/"
}

/**
 * Installed PWA and offline: full document navigation (service worker HTML cache).
 * Browser tab online: Next.js client navigation.
 */
export const OperatorLink = React.forwardRef<HTMLAnchorElement, OperatorLinkProps>(
  function OperatorLink({ href, prefetch, replace, scroll, onClick, ...rest }, ref) {
    const useDocument = useDocumentNavigation()
    const path = hrefToPath(href)

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) {
          return
        }
        if (!useDocument) {
          return
        }
        event.preventDefault()
        window.location.assign(path)
      },
      [onClick, path, useDocument]
    )

    if (useDocument) {
      return <a ref={ref} href={path} onClick={handleClick} {...rest} />
    }

    return (
      <Link
        ref={ref}
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        onClick={onClick}
        {...rest}
      />
    )
  }
)

OperatorLink.displayName = "OperatorLink"
