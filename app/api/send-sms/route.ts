import twilio from "twilio"
import { NextResponse } from "next/server"

import { logRouteHandlerError } from "@/lib/server/routeErrorLog"
import type {
  SendSmsErrorResponse,
  SendSmsRequest,
  SendSmsSuccessResponse,
} from "@/lib/types/sendSms"
import { buildBikeParkReadySmsBody } from "@/lib/utils/smsMessageBody"
import { sanitizeSmsToE164 } from "@/lib/utils/sanitizeSmsTo"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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

  return {
    ok: true,
    value: {
      to,
      ticketNumber: ticketNumberRaw,
      patronName,
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

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    logRouteHandlerError(
      "send-sms",
      new Error("Twilio environment variables are not configured"),
    )
    const payload: SendSmsErrorResponse = { error: "SMS delivery failed" }
    return NextResponse.json(payload, { status: 500 })
  }

  const messageBody = buildBikeParkReadySmsBody(
    parsedBody.value.ticketNumber,
    parsedBody.value.patronName,
  )
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
    const payload: SendSmsErrorResponse = { error: "SMS delivery failed" }
    return NextResponse.json(payload, { status: 500 })
  }
}
