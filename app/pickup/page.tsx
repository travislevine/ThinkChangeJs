"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export default function PickupPage() {
  const router = useRouter()

  const onBack = React.useCallback(() => {
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[44px] w-fit"
          onClick={onBack}
        >
          ← Back
        </Button>

        <h2 className="text-xl font-semibold">Pick Up</h2>
      </div>
    </div>
  )
}

