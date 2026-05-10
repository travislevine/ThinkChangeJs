"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { PickupSearchFilterBar } from "@/components/pickup/PickupSearchFilterBar"
import { PickupTicketSearchSections } from "@/components/pickup/PickupTicketSearchSections"
import { Button } from "@/components/ui/button"
import { usePickupTickets } from "@/hooks/usePickupTickets"

export default function PickupPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showCompleted, setShowCompleted] = React.useState(false)

  const { activeTickets, completedTickets, isLoading, error } = usePickupTickets(searchQuery)

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

        <PickupSearchFilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          showCompleted={showCompleted}
          onShowCompletedChange={setShowCompleted}
        />

        <PickupTicketSearchSections
          activeTickets={activeTickets}
          completedTickets={completedTickets}
          showCompleted={showCompleted}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}
