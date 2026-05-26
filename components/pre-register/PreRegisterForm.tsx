"use client"

import * as React from "react"

import { DeviceRow } from "@/components/park/DeviceRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSubmitPreRegister } from "@/hooks/useSubmitPreRegister"
import { MAX_DEVICES_PER_TICKET } from "@/lib/constants/ticketDevices"
import type { DropOffBlankEntryFormState } from "@/lib/types/dropOffForm"
import { newEmptyDeviceRow } from "@/lib/utils/expandDeviceRows"
import { validatePreRegisterForm } from "@/lib/utils/validatePreRegisterForm"

export interface PreRegisterFormProps {
  eventName: string
  onSuccess: (result: { smsSent: boolean; mobileProvided: boolean }) => void
}

function defaultState(): DropOffBlankEntryFormState {
  return {
    ticketNumber: "",
    patronName: "",
    mobile: "",
    email: "",
    devices: [newEmptyDeviceRow()],
    notes: "",
  }
}

export function PreRegisterForm({ eventName, onSuccess }: PreRegisterFormProps) {
  const [state, setState] = React.useState<DropOffBlankEntryFormState>(defaultState)
  const [submitAttempted, setSubmitAttempted] = React.useState(false)
  const { submit, isSubmitting, error: submitError, clearError } = useSubmitPreRegister()

  const errors = React.useMemo(() => {
    if (!submitAttempted) {
      return {}
    }
    return validatePreRegisterForm({
      patronName: state.patronName,
      mobile: state.mobile,
      email: state.email,
      devices: state.devices,
    })
  }, [state, submitAttempted])

  const atDeviceLimit = state.devices.length >= MAX_DEVICES_PER_TICKET

  const onSubmit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setSubmitAttempted(true)
      clearError()

      const nextErrors = validatePreRegisterForm({
        patronName: state.patronName,
        mobile: state.mobile,
        email: state.email,
        devices: state.devices,
      })

      if (Object.keys(nextErrors).length > 0) {
        const first = document.querySelector("[aria-invalid='true']")
        if (first instanceof HTMLElement) {
          first.scrollIntoView({ block: "center", behavior: "smooth" })
          first.focus()
        }
        return
      }

      try {
        const result = await submit({
          patronName: state.patronName,
          mobile: state.mobile,
          email: state.email,
          devices: state.devices,
          notes: state.notes,
        })
        onSuccess({ smsSent: result.smsSent, mobileProvided: Boolean(state.mobile.trim()) })
      } catch {
        // inline error from hook
      }
    },
    [clearError, onSuccess, state, submit]
  )

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
      <p className="text-sm text-muted-foreground">
        Register for <span className="font-medium text-foreground">{eventName}</span>. Your ticket
        number will be assigned when you arrive at BikePark.
      </p>

      <div className="grid grid-cols-1 gap-3">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="preRegisterName">Your name</Label>
            <Badge variant="secondary">Required</Badge>
          </div>
          <Input
            id="preRegisterName"
            autoComplete="name"
            value={state.patronName}
            onChange={(e) => setState((s) => ({ ...s, patronName: e.target.value }))}
            className="min-h-[44px]"
            aria-invalid={Boolean(errors.patronName)}
          />
          {errors.patronName ? (
            <p className="text-sm text-destructive">{errors.patronName}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-[28px] items-center justify-between gap-3">
                <Label htmlFor="preRegisterMobile">Mobile</Label>
                <Badge variant="outline">Optional</Badge>
              </div>
              <Input
                id="preRegisterMobile"
                type="tel"
                autoComplete="tel"
                value={state.mobile}
                onChange={(e) => setState((s) => ({ ...s, mobile: e.target.value }))}
                className="min-h-[44px]"
                aria-invalid={Boolean(errors.mobile)}
              />
              {errors.mobile ? (
                <p className="text-sm text-destructive">{errors.mobile}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-[28px] items-center justify-between gap-3">
                <Label htmlFor="preRegisterEmail">Email</Label>
                <Badge variant="outline">Optional</Badge>
              </div>
              <Input
                id="preRegisterEmail"
                type="email"
                autoComplete="email"
                value={state.email}
                onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                className="min-h-[44px]"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>
          </div>
          {!errors.mobile ? (
            <p className="text-xs text-muted-foreground">
              Add your mobile to receive a confirmation text.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Label>Devices</Label>
              <Badge variant="secondary">Required</Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              disabled={atDeviceLimit}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  devices: [...s.devices, newEmptyDeviceRow()],
                }))
              }
            >
              Add device
            </Button>
          </div>
          {atDeviceLimit ? (
            <p className="text-sm text-muted-foreground">
              Maximum {MAX_DEVICES_PER_TICKET} devices per registration.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {state.devices.map((row) => (
              <DeviceRow
                key={row.id}
                value={row}
                onChange={(next) =>
                  setState((s) => ({
                    ...s,
                    devices: s.devices.map((d) => (d.id === row.id ? next : d)),
                  }))
                }
                onRemove={() =>
                  setState((s) => ({
                    ...s,
                    devices:
                      s.devices.length > 1
                        ? s.devices.filter((d) => d.id !== row.id)
                        : s.devices,
                  }))
                }
              />
            ))}
          </div>
          {errors.devices ? (
            <p className="text-sm text-destructive">{errors.devices}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="preRegisterNotes">Notes</Label>
          <Textarea
            id="preRegisterNotes"
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            placeholder="Optional details for staff"
            rows={3}
          />
        </div>
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" className="min-h-[44px] w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit pre-registration"}
      </Button>
    </form>
  )
}

PreRegisterForm.displayName = "PreRegisterForm"
