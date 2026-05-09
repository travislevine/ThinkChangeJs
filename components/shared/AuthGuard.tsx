"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

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
      router.replace("/pin")
    }
    if (isAuthorised && pathname === "/pin") {
      router.replace("/")
    }
  }, [ready, isAuthorised, pathname, router])

  if (!ready && pathname !== "/pin") {
    return null
  }

  if (!ready && pathname === "/pin") {
    return <>{children}</>
  }

  if (!isAuthorised && pathname !== "/pin") {
    return null
  }

  if (isAuthorised && pathname === "/pin") {
    return null
  }

  return <>{children}</>
}
