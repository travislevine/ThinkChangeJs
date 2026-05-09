"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePinAuth } from "@/hooks/usePinAuth"

const PIN_PATTERN = /^\d{4,6}$/

export default function PinPage() {
  const router = useRouter()
  const { ready, unlock } = usePinAuth()
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!PIN_PATTERN.test(pin)) {
      setError("Enter 4–6 digits")
      return
    }

    setSubmitting(true)
    try {
      const ok = await unlock(pin)
      if (!ok) {
        setError("Incorrect PIN")
        return
      }
      router.replace("/")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-10">
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">BikePark</h2>
          <p className="text-sm text-muted-foreground">Enter crew PIN to continue</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              disabled={!ready || submitting}
              className="min-h-[44px] text-center text-2xl tracking-[0.3em] tabular-nums"
              value={pin}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6)
                setPin(next)
              }}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="min-h-[44px] w-full"
            disabled={!ready || submitting}
          >
            Unlock
          </Button>
        </form>
      </div>
    </div>
  )
}
