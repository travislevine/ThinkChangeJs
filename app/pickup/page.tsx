"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { PickupSearchFilterBar } from "@/components/pickup/PickupSearchFilterBar"
import { PickupTicketSearchSections } from "@/components/pickup/PickupTicketSearchSections"
import { Button } from "@/components/ui/button"
import { operatorNavigate } from "@/hooks/useOperatorNavigate"
import { usePickupTicketDeviceLines } from "@/hooks/usePickupTicketDeviceLines"
import { usePickupTickets } from "@/hooks/usePickupTickets"

export default function PickupPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showCompleted, setShowCompleted] = React.useState(false)

  const { activeTickets, completedTickets, isLoading, error } = usePickupTickets(searchQuery)
  const {
    linesByTicketId,
    isLoading: isDevicesLoading,
    error: devicesError,
  } = usePickupTicketDeviceLines()

  const onBack = React.useCallback(() => {
    operatorNavigate(router, "/")
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
          deviceLinesByTicketId={linesByTicketId}
          isDevicesLoading={isDevicesLoading}
          error={error}
          devicesError={devicesError}
        />
      </div>
    </div>
  )
}
