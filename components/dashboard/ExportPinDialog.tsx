"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EXPORT_PIN_PATTERN } from "@/lib/constants/exportPin"
import { isExportPinConfigured, verifyExportPin } from "@/lib/utils/verifyExportPin"

export interface ExportPinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void | Promise<void>
}

export function ExportPinDialog({ open, onOpenChange, onVerified }: ExportPinDialogProps) {
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const resetForm = React.useCallback(() => {
    setPin("")
    setError(null)
    setSubmitting(false)
  }, [])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm()
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetForm]
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isExportPinConfigured()) {
      setError("Export PIN is not configured on this device.")
      return
    }

    if (!EXPORT_PIN_PATTERN.test(pin)) {
      setError("Enter 4–6 digits")
      return
    }

    if (!verifyExportPin(pin)) {
      setError("Incorrect PIN")
      return
    }

    setSubmitting(true)
    try {
      await onVerified()
      handleOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Export PIN</DialogTitle>
          <DialogDescription>
            Please enter the PIN to export the CSV information.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="export-pin">PIN</Label>
            <Input
              id="export-pin"
              name="export-pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              disabled={submitting}
              className="min-h-[44px] text-center text-2xl tracking-[0.3em] tabular-nums"
              value={pin}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6)
                setPin(next)
              }}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] sm:flex-1"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="min-h-[44px] sm:flex-1" disabled={submitting}>
              Export CSV
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

ExportPinDialog.displayName = "ExportPinDialog"
