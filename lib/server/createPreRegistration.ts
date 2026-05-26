import twilio from "twilio"

import { TICKET_STATUS_PRE_REGISTERED } from "@/lib/constants/ticketStatus"
import { PRE_REGISTER_DEVICE_ID } from "@/lib/constants/preRegister"
import { logRouteHandlerError } from "@/lib/server/routeErrorLog"
import { createSupabaseAdminClient } from "@/lib/server/supabaseAdmin"
import type { PreRegisterDeviceInput, PreRegisterSubmitRequest } from "@/lib/types/preRegister"
import { aggregateDevicesToBreakdown } from "@/lib/utils/aggregateDeviceBreakdown"
import { normaliseAuMobileForStorage } from "@/lib/utils/normaliseAuMobile"
import { sanitizeSmsToE164 } from "@/lib/utils/sanitizeSmsTo"
import { buildBikeParkPreRegisteredSmsBody } from "@/lib/utils/smsMessageBody"
import {
  parsePreRegisterDevices,
  validatePreRegisterEmail,
  validatePreRegisterMobile,
  validatePreRegisterPatronName,
} from "@/lib/utils/validatePreRegisterForm"

export interface ActiveEventSummary {
  id: string
  name: string
}

export async function fetchActiveEventForPreRegister(): Promise<ActiveEventSummary | null> {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("events")
    .select("id, name")
    .eq("is_active", 1)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.id || !data.name) {
    return null
  }

  return { id: data.id, name: data.name }
}

async function hasDuplicateMobile(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  mobile: string
): Promise<boolean> {
  const { data, error } = await admin
    .from("tickets")
    .select("mobile")
    .eq("event_id", eventId)
    .eq("status", TICKET_STATUS_PRE_REGISTERED)
    .is("deleted_at", null)
    .not("mobile", "is", null)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).some((row) => {
    const stored = normaliseAuMobileForStorage(String(row.mobile ?? ""))
    return stored !== null && stored === mobile
  })
}

async function sendPreRegisterConfirmationSms(
  mobile: string,
  patronName: string,
  devices: PreRegisterDeviceInput[]
): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()

  if (!accountSid || !authToken || !fromNumber) {
    logRouteHandlerError(
      "pre-register-sms",
      new Error("Twilio environment variables are not configured")
    )
    return false
  }

  const toE164 = sanitizeSmsToE164(mobile)
  if (!toE164 || toE164.length < 8) {
    return false
  }

  const breakdown = aggregateDevicesToBreakdown(devices)
  const body = buildBikeParkPreRegisteredSmsBody(patronName, breakdown)
  const client = twilio(accountSid, authToken)

  try {
    await client.messages.create({
      from: fromNumber,
      to: toE164,
      body,
    })
    return true
  } catch (error: unknown) {
    logRouteHandlerError("pre-register-sms", error)
    return false
  }
}

export type CreatePreRegistrationResult =
  | { ok: true; smsSent: boolean }
  | { ok: false; status: number; error: string }

export async function createPreRegistration(
  input: PreRegisterSubmitRequest
): Promise<CreatePreRegistrationResult> {
  const nameError = validatePreRegisterPatronName(input.patronName)
  if (nameError) {
    return { ok: false, status: 400, error: nameError }
  }

  const mobileRaw = input.mobile?.trim() ?? ""
  const mobileError = validatePreRegisterMobile(mobileRaw)
  if (mobileError) {
    return { ok: false, status: 400, error: mobileError }
  }

  const emailRaw = input.email?.trim() ?? ""
  const emailError = validatePreRegisterEmail(emailRaw)
  if (emailError) {
    return { ok: false, status: 400, error: emailError }
  }

  const parsedDevices = parsePreRegisterDevices(input.devices)
  if (!parsedDevices.ok) {
    return { ok: false, status: 400, error: parsedDevices.error }
  }

  const event = await fetchActiveEventForPreRegister()
  if (!event) {
    return { ok: false, status: 503, error: "Registrations are currently closed." }
  }

  const storedMobile = mobileRaw ? normaliseAuMobileForStorage(mobileRaw) : null
  if (mobileRaw && !storedMobile) {
    return { ok: false, status: 400, error: "Enter a valid mobile number." }
  }

  const admin = createSupabaseAdminClient()

  if (storedMobile) {
    const duplicate = await hasDuplicateMobile(admin, event.id, storedMobile)
    if (duplicate) {
      return {
        ok: false,
        status: 409,
        error: "This mobile number is already registered for this event.",
      }
    }
  }

  const ticketId = crypto.randomUUID()
  const deviceCount = parsedDevices.devices.length
  const patronName = input.patronName.trim()

  const { error: ticketError } = await admin.from("tickets").insert({
    id: ticketId,
    event_id: event.id,
    ticket_number: null,
    patron_name: patronName,
    mobile: storedMobile,
    email: emailRaw || null,
    total_devices: deviceCount,
    devices_remaining: deviceCount,
    status: TICKET_STATUS_PRE_REGISTERED,
    deleted_at: null,
    device_id: PRE_REGISTER_DEVICE_ID,
  })

  if (ticketError) {
    logRouteHandlerError("pre-register", ticketError)
    return { ok: false, status: 500, error: "Registration failed. Please try again." }
  }

  const deviceRows = parsedDevices.devices.map((device) => ({
    id: crypto.randomUUID(),
    ticket_id: ticketId,
    device_type: device.deviceType,
    quantity: 1,
    colour: device.colour,
  }))

  const { error: devicesError } = await admin.from("devices").insert(deviceRows)
  if (devicesError) {
    await admin.from("tickets").delete().eq("id", ticketId)
    logRouteHandlerError("pre-register", devicesError)
    return { ok: false, status: 500, error: "Registration failed. Please try again." }
  }

  const note = input.notes?.trim()
  if (note) {
    const { error: noteError } = await admin.from("notes").insert({
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      content: note,
      recorded_at: Math.floor(Date.now() / 1000),
    })
    if (noteError) {
      logRouteHandlerError("pre-register-note", noteError)
    }
  }

  let smsSent = false
  if (storedMobile) {
    smsSent = await sendPreRegisterConfirmationSms(storedMobile, patronName, parsedDevices.devices)
  }

  return { ok: true, smsSent }
}
