"use client"

import * as React from "react"

import { PreRegisterForm } from "@/components/pre-register/PreRegisterForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePreRegisterStatus } from "@/hooks/usePreRegisterStatus"

export default function PreRegisterPage() {
  const { status, isLoading, error, refresh } = usePreRegisterStatus()
  const [success, setSuccess] = React.useState<{ smsSent: boolean; mobileProvided: boolean } | null>(
    null
  )

  if (success) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center gap-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Thank you</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
            <p>You&apos;re pre-registered for BikePark.</p>
            {success.smsSent ? (
              <p>A confirmation text has been sent to your mobile.</p>
            ) : success.mobileProvided ? (
              <p>
                We could not send a confirmation text, but staff will still have your registration.
                Present your details at drop-off to receive your ticket number.
              </p>
            ) : (
              <p>Present your name at drop-off to receive your ticket number.</p>
            )}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-6 p-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">BikePark pre-registration</h1>
        <p className="text-sm text-muted-foreground">
          Register your devices before you arrive at the event.
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : null}

      {!isLoading && error ? (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 text-sm">
            <p className="text-destructive">{error}</p>
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => void refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && status && !status.open ? (
        <Card>
          <CardHeader>
            <CardTitle>Registrations closed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>There is no active BikePark event accepting pre-registrations right now.</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && status?.open && status.eventName ? (
        <Card>
          <CardContent className="pt-6">
            <PreRegisterForm
              eventName={status.eventName}
              onSuccess={(result) => setSuccess(result)}
            />
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
