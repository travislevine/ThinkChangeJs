"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function PickupPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <Button asChild variant="outline" size="lg" className="min-h-[44px] w-fit">
          <Link href="/">← Back</Link>
        </Button>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Pick Up</h2>
          <p className="text-sm text-muted-foreground">Placeholder page</p>
        </div>
      </div>
    </div>
  )
}

