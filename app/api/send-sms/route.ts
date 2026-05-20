import twilio from "twilio"
import { NextResponse } from "next/server"

import { mapTwilioSmsErrorToClientMessage } from "@/lib/server/mapTwilioSmsError"
import { logRouteHandlerError } from "@/lib/server/routeErrorLog"
import type {
  SendSmsErrorResponse,
  SendSmsRequest,
  SendSmsSuccessResponse,
  SmsMessageVariant,
  SmsPicksByType,
} from "@/lib/types/sendSms"
import { buildSmsMessageBody } from "@/lib/utils/smsMessageBody"
import { sanitizeSmsToE164 } from "@/lib/utils/sanitizeSmsTo"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parsePicksByType(body: Record<string, unknown>): SmsPicksByType | undefined {
  const raw = body.picksByType
  if (raw === undefined) {
    return undefined
  }
  if (!isRecord(raw)) {
    return undefined
  }

  const picks: SmsPicksByType = {}
  for (const [deviceType, qty] of Object.entries(raw)) {
    if (typeof qty !== "number" || !Number.isFinite(qty)) {
      return undefined
    }
    picks[deviceType] = Math.floor(qty)
  }
  return picks
}

function parseSendSmsRequest(
  body: unknown,
):
  | { ok: true; value: SendSmsRequest }
  | { ok: false; response: NextResponse } {
  if (!isRecord(body)) {
    const payload: SendSmsErrorResponse = { error: "Invalid request body" }
    return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
  }

  const to = body.to
  if (typeof to !== "string" || to.trim() === "") {
    const payload: SendSmsErrorResponse = {
      error: "Mobile number is required",
    }
    return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
  }

  const ticketNumberRaw = body.ticketNumber
  if (ticketNumberRaw === undefined) {
    const payload: SendSmsErrorResponse = {
      error: "Ticket number is required",
    }
    return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
  }

  if (typeof ticketNumberRaw !== "number" || !Number.isFinite(ticketNumberRaw)) {
    const payload: SendSmsErrorResponse = {
      error: "Ticket number is required",
    }
    return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
  }

  let patronName: string | null = null
  if (body.patronName !== undefined && body.patronName !== null) {
    if (typeof body.patronName !== "string") {
      const payload: SendSmsErrorResponse = { error: "Invalid request body" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
    patronName = body.patronName
  }

  let variant: SmsMessageVariant = "ready_for_collection"
  if (body.variant !== undefined) {
    if (
      body.variant !== "ready_for_collection" &&
      body.variant !== "checked_in" &&
      body.variant !== "pickup"
    ) {
      const payload: SendSmsErrorResponse = { error: "Invalid request body" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
    variant = body.variant
  }

  let checkedInAt: number | undefined
  if (body.checkedInAt !== undefined) {
    if (typeof body.checkedInAt !== "number" || !Number.isFinite(body.checkedInAt)) {
      const payload: SendSmsErrorResponse = { error: "Invalid request body" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
    checkedInAt = Math.floor(body.checkedInAt)
  }

  let pickedUpAt: number | undefined
  if (body.pickedUpAt !== undefined) {
    if (typeof body.pickedUpAt !== "number" || !Number.isFinite(body.pickedUpAt)) {
      const payload: SendSmsErrorResponse = { error: "Invalid request body" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
    pickedUpAt = Math.floor(body.pickedUpAt)
  }

  const picksByType = parsePicksByType(body)
  if (body.picksByType !== undefined && picksByType === undefined) {
    const payload: SendSmsErrorResponse = { error: "Invalid request body" }
    return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
  }

  let allDevicesPickedUp = false
  if (body.allDevicesPickedUp !== undefined) {
    if (typeof body.allDevicesPickedUp !== "boolean") {
      const payload: SendSmsErrorResponse = { error: "Invalid request body" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
    allDevicesPickedUp = body.allDevicesPickedUp
  }

  if (variant === "checked_in" && checkedInAt === undefined) {
    const payload: SendSmsErrorResponse = { error: "Check-in time is required" }
    return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
  }

  if (variant === "pickup") {
    if (pickedUpAt === undefined) {
      const payload: SendSmsErrorResponse = { error: "Pick-up time is required" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
    if (!picksByType || Object.values(picksByType).every((q) => q <= 0)) {
      const payload: SendSmsErrorResponse = { error: "Pick-up devices are required" }
      return { ok: false, response: NextResponse.json(payload, { status: 400 }) }
    }
  }

  return {
    ok: true,
    value: {
      to,
      ticketNumber: ticketNumberRaw,
      patronName,
      variant,
      checkedInAt,
      pickedUpAt,
      picksByType,
      allDevicesPickedUp,
    },
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    const payload: SendSmsErrorResponse = { error: "Invalid request body" }
    return NextResponse.json(payload, { status: 400 })
  }

  const parsedBody = parseSendSmsRequest(parsed)
  if (!parsedBody.ok) {
    return parsedBody.response
  }

  const toE164 = sanitizeSmsToE164(parsedBody.value.to)
  if (!toE164 || toE164.length < 8) {
    const payload: SendSmsErrorResponse = {
      error: "Mobile number is required",
    }
    return NextResponse.json(payload, { status: 400 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()

  if (!accountSid || !authToken || !fromNumber) {
    logRouteHandlerError(
      "send-sms",
      new Error("Twilio environment variables are not configured"),
    )
    const payload: SendSmsErrorResponse = { error: "SMS delivery failed" }
    return NextResponse.json(payload, { status: 500 })
  }

  const req = parsedBody.value
  const messageBody = buildSmsMessageBody({
    variant: req.variant ?? "ready_for_collection",
    ticketNumber: req.ticketNumber,
    patronName: req.patronName,
    checkedInAtSeconds: req.checkedInAt,
    pickedUpAtSeconds: req.pickedUpAt,
    picksByType: req.picksByType,
    allDevicesPickedUp: req.allDevicesPickedUp,
  })
  const client = twilio(accountSid, authToken)

  try {
    const message = await client.messages.create({
      from: fromNumber,
      to: toE164,
      body: messageBody,
    })

    const payload: SendSmsSuccessResponse = {
      success: true,
      sid: message.sid,
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (error: unknown) {
    logRouteHandlerError("send-sms", error)
    const payload: SendSmsErrorResponse = {
      error: mapTwilioSmsErrorToClientMessage(error),
    }
    return NextResponse.json(payload, { status: 500 })
  }
}
