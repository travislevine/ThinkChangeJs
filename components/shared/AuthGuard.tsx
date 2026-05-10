"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { usePinAuth } from "@/hooks/usePinAuth"

export interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, isAuthorised } = usePinAuth()

  React.useEffect(() => {
    if (!ready) return
    if (!isAuthorised && pathname !== "/pin") {
      const next = encodeURIComponent(pathname || "/")
      router.replace(`/pin?next=${next}`)
    }
  }, [ready, isAuthorised, pathname, router])

  // Never guard the PIN page; otherwise you can end up with a blank screen
  // during redirects/hydration.
  if (pathname === "/pin") {
    return <>{children}</>
  }

  if (!ready) {
    return (
      <div className="min-h-[100dvh] bg-background p-4" aria-busy="true">
        <Skeleton className="mx-auto mt-12 h-12 w-full max-w-md rounded-lg" />
      </div>
    )
  }

  if (!isAuthorised) {
    return null
  }

  return <>{children}</>
}
