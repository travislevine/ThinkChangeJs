"use client"

import * as React from "react"

import { DeviceRow } from "@/components/park/DeviceRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { COLOURS } from "@/lib/constants/colours"
import { DEVICE_CATEGORIES } from "@/lib/constants/deviceCategories"
import { TICKET_NUMBER_POOL_MAX, TICKET_NUMBER_POOL_MIN } from "@/lib/constants/ticketPool"
import type { DropOffBlankEntryFormState, DropOffDeviceRow } from "@/lib/types/dropOffForm"
import { useTicketNumberAvailability } from "@/hooks/useTicketNumberAvailability"

export interface BlankEntryFormProps {
  onTouched: (touched: boolean) => void
}

const DEVICE_COUNT_PRESETS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"] as const

function newDeviceRow(): DropOffDeviceRow {
  return {
    id: crypto.randomUUID(),
    deviceType: DEVICE_CATEGORIES[0],
    quantity: 1,
    colour: COLOURS[0],
  }
}

function defaultState(): DropOffBlankEntryFormState {
  return {
    ticketNumber: "",
    patronName: "",
    mobile: "",
    email: "",
    deviceCountMode: "preset",
    deviceCountPreset: "1",
    deviceCountCustom: "",
    devices: [newDeviceRow()],
    notes: "",
  }
}

function parseTicketNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  const int = Math.floor(n)
  if (int < TICKET_NUMBER_POOL_MIN || int > TICKET_NUMBER_POOL_MAX) return null
  return int
}

type BlankEntryErrors = Partial<{
  ticketNumber: string
  ticketNumberDuplicate: string
  patronName: string
  mobile: string
  email: string
  deviceCount: string
  devices: string
}>

function normaliseMobileDigits(value: string): string {
  return value.replace(/\D/g, "")
}

function validateBlankEntry(
  state: DropOffBlankEntryFormState,
  ticketNumberInt: number | null,
  ticketInUse: boolean
): BlankEntryErrors {
  const errors: BlankEntryErrors = {}

  if (!ticketNumberInt) {
    errors.ticketNumber = `Enter a valid ticket number (${TICKET_NUMBER_POOL_MIN}–${TICKET_NUMBER_POOL_MAX}).`
  } else if (ticketInUse) {
    errors.ticketNumberDuplicate = `Ticket #${ticketNumberInt} is already in use.`
  }

  const name = state.patronName.trim()
  if (name) {
    // Letters and spaces only.
    if (!/^[A-Za-z ]+$/.test(name)) {
      errors.patronName = "Use letters A–Z only."
    }
  }

  const mobile = state.mobile.trim()
  if (mobile) {
    const digits = normaliseMobileDigits(mobile)
    if (digits.length > 10) {
      errors.mobile = "Mobile number must be at most 10 digits."
    } else if (digits.length !== 10) {
      errors.mobile = "Mobile number must be 10 digits."
    } else if (!digits.startsWith("0")) {
      errors.mobile = "Mobile number must start with 0."
    }
  }

  const email = state.email.trim()
  if (email) {
    // Simple email validation: something@something.something
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address."
    }
  }

  if (state.deviceCountMode === "custom") {
    const digits = normaliseMobileDigits(state.deviceCountCustom)
    const n = Number(digits)
    if (!digits || !Number.isFinite(n) || n < 11) {
      errors.deviceCount = "Enter a number greater than 10."
    }
  }

  if (!state.devices.length) {
    errors.devices = "Add at least one device."
  }

  return errors
}

export function BlankEntryForm({ onTouched }: BlankEntryFormProps) {
  const [state, setState] = React.useState<DropOffBlankEntryFormState>(() => defaultState())

  const ticketNumberInt = React.useMemo(() => parseTicketNumber(state.ticketNumber), [state.ticketNumber])
  const ticketAvailability = useTicketNumberAvailability(ticketNumberInt)

  const [submitAttempted, setSubmitAttempted] = React.useState(false)
  const errors = React.useMemo(() => {
    if (!submitAttempted) return {}
    return validateBlankEntry(state, ticketNumberInt, Boolean(ticketNumberInt && ticketAvailability.inUse))
  }, [state, submitAttempted, ticketAvailability.inUse, ticketNumberInt])

  const touched = React.useMemo(() => {
    const initial = defaultState()
    return (
      state.ticketNumber !== initial.ticketNumber ||
      state.patronName !== initial.patronName ||
      state.mobile !== initial.mobile ||
      state.email !== initial.email ||
      state.deviceCountPreset !== initial.deviceCountPreset ||
      state.deviceCountCustom !== initial.deviceCountCustom ||
      state.notes !== initial.notes ||
      state.devices.length !== initial.devices.length ||
      state.devices.some((d, i) => {
        const base = initial.devices[i]
        if (!base) return true
        return (
          d.deviceType !== base.deviceType ||
          d.quantity !== base.quantity ||
          d.colour !== base.colour
        )
      })
    )
  }, [state])

  React.useEffect(() => {
    onTouched(touched)
  }, [onTouched, touched])

  const showTicketError = Boolean(errors.ticketNumber)
  const showDuplicateWarning = Boolean(errors.ticketNumberDuplicate)
  const showPatronNameError = Boolean(errors.patronName)
  const showMobileError = Boolean(errors.mobile)
  const showEmailError = Boolean(errors.email)
  const showDeviceCountError = Boolean(errors.deviceCount)
  const showDevicesError = Boolean(errors.devices)

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="ticketNumber">Ticket Number</Label>
            <Badge variant="secondary">Required</Badge>
          </div>
          <Input
            id="ticketNumber"
            inputMode="numeric"
            placeholder={`e.g. ${TICKET_NUMBER_POOL_MIN}`}
            value={state.ticketNumber}
            onChange={(e) => setState((s) => ({ ...s, ticketNumber: e.target.value }))}
            className="min-h-[44px]"
            aria-invalid={showTicketError || showDuplicateWarning}
          />
          {showTicketError ? <p className="text-sm text-destructive">{errors.ticketNumber}</p> : null}
          {showDuplicateWarning ? (
            <p className="text-sm text-destructive">{errors.ticketNumberDuplicate}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5 sm:col-span-1">
            <Label htmlFor="patronName">Patron Name</Label>
            <Input
              id="patronName"
              value={state.patronName}
              onChange={(e) => setState((s) => ({ ...s, patronName: e.target.value }))}
              className="min-h-[44px]"
              aria-invalid={showPatronNameError}
            />
            {showPatronNameError ? (
              <p className="text-sm text-destructive">{errors.patronName}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5 sm:col-span-1">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              type="tel"
              value={state.mobile}
              onChange={(e) => setState((s) => ({ ...s, mobile: e.target.value }))}
              className="min-h-[44px]"
              aria-invalid={showMobileError}
            />
            {showMobileError ? (
              <p className="text-sm text-destructive">{errors.mobile}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5 sm:col-span-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              className="min-h-[44px]"
              aria-invalid={showEmailError}
            />
            {showEmailError ? (
              <p className="text-sm text-destructive">{errors.email}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label>Number of Devices</Label>
            <Badge variant="secondary">Required</Badge>
          </div>
          <Select
            value={state.deviceCountPreset}
            onValueChange={(next) => {
              setState((s) => ({
                ...s,
                deviceCountPreset: next,
                deviceCountMode: next === "10+" ? "custom" : "preset",
                deviceCountCustom: next === "10+" ? s.deviceCountCustom : "",
              }))
            }}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEVICE_COUNT_PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {state.deviceCountMode === "custom" ? (
            <Input
              inputMode="numeric"
              placeholder="Enter device count"
              value={state.deviceCountCustom}
              onChange={(e) => setState((s) => ({ ...s, deviceCountCustom: e.target.value }))}
              className="min-h-[44px]"
              aria-invalid={showDeviceCountError}
            />
          ) : null}
          {showDeviceCountError ? (
            <p className="text-sm text-destructive">{errors.deviceCount}</p>
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
              onClick={() => setState((s) => ({ ...s, devices: [...s.devices, newDeviceRow()] }))}
            >
              Add Device
            </Button>
          </div>

          <div className="flex flex-col gap-3">
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
                    devices: s.devices.length > 1 ? s.devices.filter((d) => d.id !== row.id) : s.devices,
                  }))
                }
              />
            ))}
          </div>
          {showDevicesError ? (
            <p className="text-sm text-destructive">{errors.devices}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional notes…"
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          />
        </div>
      </div>

      {/* Temporary: submit-attempt toggle so we can show Phase 2.3 submit-time errors before Phase 2.4 exists. */}
      {process.env.NODE_ENV === "development" ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => setSubmitAttempted(true)}
          >
            Validate (dev)
          </Button>
          {ticketAvailability.error ? (
            <p className="text-sm text-muted-foreground">Ticket check: {ticketAvailability.error}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

BlankEntryForm.displayName = "BlankEntryForm"

